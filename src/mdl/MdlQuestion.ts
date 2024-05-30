import Mdl0Base from './Mdl0Base';
import * as fs from "firebase/firestore";

export default class MdlQuestion extends Mdl0Base<MdlQuestion> {
  protected static _collectionName: string = 'questions';
  // protected static _fieldNames: string[] = ['category', 'caption', 'specification', 'definition', 'args_and_answer'];

  get _category() { return this.data['category']; }
  set _category(value) { this.data['category'] = value; }

  get _lead() { return this.data['lead']; }
  set _lead(value) { this.data['lead'] = value; }

  get _caption() { return this.data['caption']; }
  set _caption(value) { this.data['caption'] = value; }

  get _specification() { return this.data['specification']; }
  set _specification(value) { this.data['specification'] = value; }

  get _definition() { return this.data['definition']; }
  set _definition(value) { this.data['definition'] = value; }

  get _args_and_answer() { return this.data['args_and_answer']; }
  set _args_and_answer(value) { this.data['args_and_answer'] = value; }

  get _hint1() { return this.data['hint1']; }
  set _hint1(value) { this.data['hint1'] = value; }

  get _hint2() { return this.data['hint2']; }
  set _hint2(value) { this.data['hint2'] = value; }

  get _hint3() { return this.data['hint3']; }
  set _hint3(value) { this.data['hint3'] = value; }

  get _inheritToNext() { return this.data['inheritToNext']; }
  set _inheritToNext(value) { this.data['inheritToNext'] = value; }

  get _createUserId() { return this.data['createUserId']; }
  set _createUserId(value) { this.data['createUserId'] = value; }

  get _updateUserId() { return this.data['updateUserId']; }
  set _updateUserId(value) { this.data['updateUserId'] = value; }
}
