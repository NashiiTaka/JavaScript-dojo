import Mdl0Base from './Mdl0Base';
import * as fs from "firebase/firestore";

export default class MdlQuestion extends Mdl0Base<MdlQuestion> {
  protected static _collectionName: string = 'questions';
  protected static _fieldNames: string[] = ['category', 'caption', 'specification', 'definition', 'args_and_answer'];

  get _category() { return this.data['category']; }
  set _category(value) { this.data['category'] = value; }

  get _caption() { return this.data['caption']; }
  set _caption(value) { this.data['caption'] = value; }

  get _specification() { return this.data['specification']; }
  set _specification(value) { this.data['specification'] = value; }

  get _definition() { return this.data['definition']; }
  set _definition(value) { this.data['definition'] = value; }

  get _args_and_answer() { return this.data['args_and_answer']; }
  set _args_and_answer(value) { this.data['args_and_answer'] = value; }
}
