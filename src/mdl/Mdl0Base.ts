import { db } from "../lib/firebaseAppIns";
import * as fs from "firebase/firestore";

/**
 *
 */
type CallBackForMdlEvent<T> = (
  mdlData: T,
  changeType: "added" | "modified" | "removed"
) => void;

/**
 * Cloud Firestoreのデータを管理するベースのジェネリッククラス。
 * フィールド名等を下位クラスでオーバーライドすることで動作する。
 *
 * スタティックメソッド: コレクションに対するCRUD + イベントハンドリング
 * インスタンスメソッド: 1ドキュメントのCRUD + イベントハンドリング
 *
 * TODO: フィールドの型チェックや、Validationなどの実装
 * TODO: サブコレクションを管理する実装
 * TODO: 外部キーでの削除同期。 → サブコレクションでの方が現実的かね？要件等。
 */
export default class Mdl0Base<T extends Mdl0Base<T>> {
  //#region static フィールド
  /**
   * コレクション名
   */
  public static get collectionName(): string {
    return this._collectionName;
  }
  protected static _collectionName: string = ""; // 要継承先でオーバーライドする
  /**
   * フィールド名の配列
   */
  public static get fieldNames(): string[] {
    return this._fieldNames;
  }
  protected static _fieldNames: string[] = []; // 要継承先でのオーバーライド
  /**
   * サブコレクション名の配列
   */
  public static get subCollectionNames(): string[] {
    return this._subCollectionNames;
  }
  protected static _subCollectionNames: string[] = []; // 要継承先でのオーバーライド
  /**
   * デフォルト値の配列。新規保存時に未設定のフィールドがあった場合、この値で設定して登録を行う。
   */
  public static get defaultValues(): any {
    return this._defaultValues;
  }
  protected static _defaultValues: any = {}; // 要継承先でのオーバーライド
  //#endregion static fields

  //#region static プロパティ
  /**
   * 管理対象のテーブルのDBコレクションリファレンス
   */
  public static get refCollection(): fs.CollectionReference {
    this._refCollection =
      this._refCollection || fs.collection(db, this.collectionName);
    return this._refCollection;
  }
  protected static _refCollection: fs.CollectionReference | null = null; // fs.collection(db, this.tabelName); // 継承先のtabelNameが取れなかったので、メソッド呼び出し時に初期化する。
  //#endregion static properties

  //#region static メソッド
  /**
   * インスタンスを生成する
   * @param this 自クラス、指定不要
   * @param idOrSnapshot ID文字列 or DocumentSnapshot
   * @returns データ取得を待つPromise
   */
  public static async Create<U extends Mdl0Base<U>>(
    this: new (idOrDocSnapshot: string | fs.DocumentSnapshot | fs.QueryDocumentSnapshot) => U,
    idOrSnapshot: string | fs.DocumentSnapshot | fs.QueryDocumentSnapshot
  ): Promise<U> {
    return new Promise(async (resolve) => {
      if (typeof idOrSnapshot == "string") {
        const ins = new this(idOrSnapshot);
        await ins.load();
        resolve(ins);
      } else {
        resolve(new this(idOrSnapshot));
      }
    });
  }
  /**
   * IDを指定し、クラスインスタンスを取得する。
   * @param this 自クラス、指定不要
   * @param id ID文字列
   * @returns クラスインスタンス、指定IDのデータが存在しない場合、null
   */
  static async get<U extends Mdl0Base<U>>(
    this: new (idOrDocSnapshot: fs.DocumentSnapshot<fs.DocumentData, fs.DocumentData>) => U,
    id: string
  ): Promise<U | null> {
    return new Promise(async (resolve) => {
      const doc = await fs.getDoc(fs.doc(db, this.prototype.constructor.collectionName, id));
      const ins = doc.exists() ? (new this(doc)) : null;

      console.log('get: ' + 1);

      resolve(ins);
    });
  }
  /**
   * 全件を取得。
   * 条件を指定した場合、合致したデータを取得。
   * 合致0件の場合は空の配列を返却。
   * @param this 自クラス、指定不要
   * @param conditions 検索パラメータ。単一条件=>string×3 field名、比較演算子、検索語 複合条件=>[field名、比較演算子、検索語],[field名、比較演算子、検索語]・・・
   * @returns Mdlクラスインスタンスの配列。
   */
  static async getAll<U extends Mdl0Base<U>>(
    this: new (idOrDocSnapshot: fs.QueryDocumentSnapshot<unknown, fs.DocumentData>) => U,
    ...conditions: any[] | Array<any[]>
  ): Promise<U[]> {
    return new Promise(async (resolve) => {
      let editedCond: any[] = [];
      if (conditions && conditions.length > 0) {
        if (!Array.isArray(conditions[0])) {
          editedCond = [conditions];
        } else {
          const recursive = (arr: any[]) => {
            for (const v of arr)
              if (!Array.isArray(v)) {
                editedCond.push(arr);
                break;
              } else {
                recursive(v);
              }
          };
          recursive(conditions);
        }
      }

      const searchConds: any[] = [];
      for (const cond of editedCond) {
        searchConds.push(fs.where(cond[0], cond[1], cond[2]));
      }

      const query = fs.query(this.prototype.constructor.refCollection, ...searchConds);
      const docs = await fs.getDocs(query);
      const ret: U[] = [];
      docs.forEach((doc) => {
        ret.push(new this(doc));
      });

      console.log('getAll: ' + docs.size);

      resolve(ret);
    });
  }
  /**
   * 存在しているかを確認
   * @param idOrConditions [ID] or [単一条件=>string×3 field名、比較演算子、検索語] or [複合条件=>[field名、比較演算子、検索語],[field名、比較演算子、検索語]・・・]
   * @returns 処理完了を待つPromise
   */
  static async exists(
    ...idOrConditions: any[] | Array<any[]>
  ): Promise<boolean> {
    if (idOrConditions.length === 1 && typeof idOrConditions[0] === "string") {
      return (await this.get(idOrConditions[0])) !== null;
    } else {
      return (await this.getAll(...idOrConditions)).length > 0;
    }
  }
  /**
   * 条件に合致する数
   * @param idOrConditions [ID] or [単一条件=>string×3 field名、比較演算子、検索語] or [複合条件=>[field名、比較演算子、検索語],[field名、比較演算子、検索語]・・・]
   * @returns 処理完了を待つPromise
   */
  static async count(...idOrConditions: any[] | Array<any[]>): Promise<number> {
    if (idOrConditions.length === 1 && typeof idOrConditions[0] === "string") {
      return (await this.get(idOrConditions[0])) !== null ? 1 : 0;
    } else {
      return (await this.getAll(...idOrConditions)).length;
    }
  }
  /**
   * 全データを削除する
   * @returns
   */
  static async deleteAll() {
    const promises: Promise<void>[] = [];

    const snapshot = await fs.getDocs(this.refCollection);
    snapshot.forEach((d) => {
      // ここでawaitをかけても処理を止められなかった。
      // そのため、promiseの配列を返却し、呼び出し元でawaitをかける。
      // 動作仕様は理解できていない。
      promises.push(fs.deleteDoc(d.ref));
    });

    return promises;
  }
  //#endregion static functions

  //#region static イベントハンドラ
  /**
   * アタッチの共通処理。RealtimeDatabaseのon〜イベントを再現する。
   * @param this 自クラス、指定不要
   * @param callback データ変更後コールバック
   * @param changeType "added" | "modified" | "removed"
   * @param ref オプショナル 参照先を指定したい場合に指定
   * @param callbackIns オプショナル callbackの際のインスタンスを指定したい場合に指定
   * @returns デタッチファンクション
   */
  private static setOnSnapshot<U extends Mdl0Base<U>>(
    this: typeof Mdl0Base,
    callback: CallBackForMdlEvent<U>,
    changeType: "added" | "modified" | "removed",
    ref: fs.Query | fs.CollectionReference | null = null,
    callbackIns: U | null = null
  ): fs.Unsubscribe {
    if (!["added", "modified", "removed"].includes(changeType)) {
      throw new Error("不正な changeType です。");
    }

    const unsubscribe = fs.onSnapshot(ref || this.refCollection, (snapshot) => {
      if (typeof snapshot.docChanges != "function") {
        throw new Error("snapshot.docChanges is not a function");
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === changeType) {
          callback(callbackIns || (new this(change.doc) as U), change.type);
        }
      });
    });
    // デタッチファンクションを返却する。
    return unsubscribe;
  }
  /**
   * コレクションでのデータの追加にアタッチ
   * @param callback データ変更後コールバック
   * @returns デタッチファンクション
   */
  public static onChildAdded<U extends Mdl0Base<U>>(
    callback: CallBackForMdlEvent<U>
  ): fs.Unsubscribe {
    return this.setOnSnapshot(callback, "added");
  }
  /**
   * コレクションでのデータの更新にアタッチ
   * @param callback データ変更後コールバック
   * @returns デタッチファンクション
   */
  public static onChildUpdated<U extends Mdl0Base<U>>(
    callback: CallBackForMdlEvent<U>
  ): fs.Unsubscribe {
    return this.setOnSnapshot(callback, "modified");
  }
  /**
   * コレクションでのデータの削除にアタッチ
   * @param callback データ変更後コールバック
   * @returns デタッチファンクション
   */
  public static onChildDeleted<U extends Mdl0Base<U>>(
    callback: CallBackForMdlEvent<U>
  ): fs.Unsubscribe {
    return this.setOnSnapshot(callback, "removed");
  }
  /**
   * コレクションでのデータの追加 or 更新にアタッチ
   * @param callback データ変更後コールバック
   * @returns デタッチファンクション
   */
  public static onChildAddedOrUpdated<U extends Mdl0Base<U>>(
    callback: CallBackForMdlEvent<U>
  ): fs.Unsubscribe {
    const unsubscribes = [
      this.setOnSnapshot(callback, "added"),
      this.setOnSnapshot(callback, "modified"),
    ];
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }
  /**
   * コレクションでのデータの追加 or 更新 or 削除にアタッチ
   * @param callback データ変更後コールバック
   * @returns デタッチファンクション
   */
  public static onChildSnapshot<U extends Mdl0Base<U>>(
    callback: CallBackForMdlEvent<U>
  ): fs.Unsubscribe {
    const unsubscribes = [
      this.setOnSnapshot(callback, "added"),
      this.setOnSnapshot(callback, "modified"),
      this.setOnSnapshot(callback, "removed"),
    ];
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }
  //#endregion イベントハンドラ

  //#region コンストラクタ
  /**
   * コンストラクタ
   * @param {string | fs.DocumentSnapshot} idOrDocSnapshot ID文字列か、DocumentSnapshot
   * @param {boolean} isNewData 新規データの場合true
   */


  /**
   * コンストラクタ
   * @param idOrDocSnapshot コンストラクタ ID、DocumentSnapshot、QueryDocumentSnapshotのいずれかを引数に取る
   * @param isNewData 新規データの場合true、デフォルトfalse
   */
  public constructor(
    idOrDocSnapshot:
      string
      | fs.DocumentSnapshot<fs.DocumentData, fs.DocumentData>
      | fs.QueryDocumentSnapshot<unknown, fs.DocumentData> = '',
    isNewData: boolean = false
  ) {
    if (typeof idOrDocSnapshot === "string" && idOrDocSnapshot !== '') {
      // type = 'id';
      this._id = idOrDocSnapshot;
      if (isNewData) {
        this._loaded = true;
      }
      this._isNewData = isNewData;
    } else if (idOrDocSnapshot) {
      // type = 'ss';
      if (isNewData) {
        throw new Error(
          "docSnapshotを指定した場合、isNewRecordはfalseを指定してください"
        );
      }
      this._id = idOrDocSnapshot.id;
      this._data = idOrDocSnapshot.data();
      this._loaded = true;
      this._isNewData = false;
    } else {
      // type= 'new';
      this._data = {};
      this._loaded = true;
      this._isNewData = true;
    }
  }
  //#endregion コンストラクタ

  //#region プロパティ
  /**
   * 自分の型をベースクラスにキャストして返却
   */
  private get myTypeAsMdl0Base() {
    return this.constructor as typeof Mdl0Base;
  }
  /**
   * ID
   */
  public get id() {
    return this._id;
  }
  private _id: string = "";
  /**
   * 新規データ
   */
  public get isNewData() {
    return this._isNewData;
  }
  public set isNewData(value) {
    this._isNewData = value;
  }
  private _isNewData = false;
  /**
   * DBで自インスタンスと同じIDのデータが更新された場合、このインスタンスのデータも更新するかのフラグ。デフォルトtrue。
   */
  public get updateSync() {
    return this._updateSyncUnsubscribe !== null;
  }
  public set updateSync(value: boolean) {
    if (!this.id) {
      throw new Error("更新同期を始める場合は、先にIDを指定して下さい。");
    }
    if (this._updateSyncUnsubscribe === null && value) {
      this._updateSyncUnsubscribe = this.onUpdated((mdl) => {
        for (const key in mdl.data) {
          this._data[key] = mdl.data[key];
        }
      });
    } else if (this._updateSyncUnsubscribe !== null && !value) {
      // デタッチを実行
      this._updateSyncUnsubscribe();
      // デタッチファンクションをnullクリア
      this._updateSyncUnsubscribe = null;
    }
  }
  private _updateSyncUnsubscribe: fs.Unsubscribe | null = null;
  /**
   * データを保持するオブジェクト
   */
  public get data(): any {
    if (!this._loaded) {
      throw new Error("dataへのアクセス前に、loadを実行してください。");
    }
    return this._data;
  }
  private _data: any = {};
  // 下記でPG上は十分だが、インテリセンスが聞かないので、プロパティは下位クラスでフィールドごとに実装する。
  // フィールド名の配列から、動的にプロパティを生成する。
  // this.constructor.fieldNames.forEach((fieldName) => {
  //   Object.defineProperty(this, '_' + fieldName, {
  //     get() { return this.data[fieldName]; },
  //     set(value) { this.data[fieldName] = value; }
  //   });
  // });
  /**
   * ドキュメントリファレンスを取得する
   */
  public get refDoc() {
    if (!this.id) {
      throw new Error("refDocを取得するためには、idを指定してください。");
    }
    return fs.doc(db, this.myTypeAsMdl0Base.collectionName, this.id);
  }
  /**
   * 自分自身のみを参照するクエリを取得する
   */
  public get queryMeById() {
    if (!this.id) {
      throw new Error("queryMeByIdを使用するには、先にidを指定してください。");
    }
    return fs.query(
      this.myTypeAsMdl0Base.refCollection,
      fs.where(fs.documentId(), "==", this.id)
    );
  }
  //#endregion プロパティ

  //#region メソッド
  /**
   * IDを元にデータを取得する。
   * @returns {Promise} データ取得を待つPromise
   */
  public async load(): Promise<void> {
    return new Promise(async (resolve) => {
      if (this._loaded) {
        resolve();
      } else {
        const ss = await fs.getDoc(this.refDoc);
        this._data = ss.exists() ? ss.data() : {};
        this._loaded = true;
        resolve();
      }
    });
  }
  private _loaded = false;
  /**
   * 追加
   * @returns 処理完了を待つPromise
   */
  public async add(): Promise<T> {
    if (!this.isNewData) {
      throw new Error("非新規データに対して、addが呼ばれました。");
    }

    return new Promise(async (resolve) => {
      // デフォルト値が設定されているフィールドがあれば、それに値を代入する。
      for (const key in this.myTypeAsMdl0Base.defaultValues) {
        if (this.data[key] === undefined) {
          this.data[key] = this.myTypeAsMdl0Base.defaultValues[key];
        }
      }

      const now = new Date();
      if (this.id) {
        await fs.setDoc(this.refDoc, {
          ...this.data,
          created_at: now,
          updated_at: now,
        });
      } else {
        const doc = await fs.addDoc(this.myTypeAsMdl0Base.refCollection, {
          ...this.data,
          created_at: now,
          updated_at: now,
        });
        this._id = doc.id;
        // 登録が終わったので、更新時同期を設定する。
        // 一旦デタッチして再アタッチする。
        if (this.updateSync) {
          // デタッチメソッド等をクリア
          this.updateSync = false;
          // 設定されたIDを元に、アタッチを開始
          this.updateSync = true;
        }
      }
      this.isNewData = false;

      resolve(this as unknown as T);
    });
  }
  /**
   * 登録しようとしているデータが存在しない場合のみ登録する。
   * idが設定されている場合はidで検索。
   * idが設定されていない場合は全てのdata設定値が一致するドキュメントが存在しなければ登録
   * @returns 処理完了を待つPromise。
   */
  public async addIfNotExists(): Promise<T> {
    if (!this.isNewData) {
      throw new Error("非新規データに対して、addが呼ばれました。");
    }

    return new Promise(async (resolve) => {
      let shouldAdd = false;
      if (this.id) {
        shouldAdd = !(await this.myTypeAsMdl0Base.exists(this.id));
      } else {
        const seachCond: any[] = [];
        for (const key in this.data) {
          seachCond.push([key, "==", this.data[key]]);
        }
        shouldAdd = !(await this.myTypeAsMdl0Base.exists(seachCond));
      }

      if (shouldAdd) {
        await this.add();
      }

      resolve(this as unknown as T);
    });
  }
  //#endregion メソッド

  //#region イベントハンドラ
  /**
   * 更新
   * @returns 処理完了を待つPromise
   */
  public async update(): Promise<T> {
    if (this.isNewData) {
      throw new Error("新規データに対して、udpateが呼ばれました。");
    }
    return new Promise(async (resolve) => {
      await fs.updateDoc(this.refDoc, { ...this.data, updated_at: new Date() });
      resolve(this as unknown as T);
    });
  }
  /**
   * 追加か更新
   * @returns 処理完了を待つPromise
   */
  public async save(): Promise<T> {
    return this.isNewData ? this.add() : this.update();
  }
  /**
   * 削除
   * @returns 処理完了を待つPromise
   */
  public async delete(): Promise<T> {
    if (this.isNewData) {
      throw new Error("新規データに対して、deleteが呼ばれました。");
    }
    return new Promise(async (resolve) => {
      await fs.deleteDoc(this.refDoc);
      resolve(this as unknown as T);
    });
  }
  /**
   * 追加時にアタッチ
   * @param callback コールバック
   * @returns デタッチファンクション
   */
  public onAdded(callback: CallBackForMdlEvent<T>): fs.Unsubscribe {
    if (!this.id) {
      throw new Error("追加にアタッチする場合は、先にIDを指定して下さい。");
    }

    return this.myTypeAsMdl0Base.setOnSnapshot(
      callback,
      "added",
      this.queryMeById,
      this as unknown as T
    );
  }
  /**
   * 更新時にアタッチ
   * @param callback コールバック
   * @returns デタッチファンクション
   */
  public onUpdated(callback: CallBackForMdlEvent<T>): fs.Unsubscribe {
    if (!this.id) {
      throw new Error("更新にアタッチする場合は、先にIDを指定して下さい。");
    }

    return this.myTypeAsMdl0Base.setOnSnapshot(
      callback,
      "modified",
      this.queryMeById,
      this as unknown as T
    );
  }
  /**
   * 削除時にアタッチ
   * @param callback コールバック
   * @returns デタッチファンクション
   */
  public onDeleted(callback: CallBackForMdlEvent<T>): fs.Unsubscribe {
    if (!this.id) {
      throw new Error("削除にアタッチする場合は、先にIDを指定して下さい。");
    }

    return this.myTypeAsMdl0Base.setOnSnapshot(
      callback,
      "removed",
      this.queryMeById,
      this as unknown as T
    );
  }
  /**
   * 追加 or 削除時にアタッチ
   * @param callback コールバック
   * @returns デタッチファンクション
   */
  public onAddedOrUpdated(callback: CallBackForMdlEvent<T>): fs.Unsubscribe {
    if (!this.id) {
      throw new Error(
        "追加・削除にアタッチする場合は、先にIDを指定して下さい。"
      );
    }

    const unsubscribes = [
      this.myTypeAsMdl0Base.setOnSnapshot(
        callback,
        "added",
        this.queryMeById,
        this as unknown as T
      ),
      this.myTypeAsMdl0Base.setOnSnapshot(
        callback,
        "modified",
        this.queryMeById,
        this as unknown as T
      ),
    ];
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }
  /**
   * 追加・変更・更新時すべてを監視
   * @param {callBackForMdlEvent} callback
   * @returns {function} fs.Unsubscribeを事項するデタッチファンクション
   */
  public onSnapshot(callback: CallBackForMdlEvent<T>): fs.Unsubscribe {
    if (!this.id) {
      throw new Error(
        "追加・削除・更新にアタッチする場合は、先にIDを指定して下さい。"
      );
    }

    const unsubscribes = [
      this.myTypeAsMdl0Base.setOnSnapshot(
        callback,
        "added",
        this.queryMeById,
        this as unknown as T
      ),
      this.myTypeAsMdl0Base.setOnSnapshot(
        callback,
        "modified",
        this.queryMeById,
        this as unknown as T
      ),
      this.myTypeAsMdl0Base.setOnSnapshot(
        callback,
        "removed",
        this.queryMeById,
        this as unknown as T
      ),
    ];
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }
  //#endregion イベントハンドラ
}
