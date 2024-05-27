import Mdl0Base from './Mdl0Base';

export default class MdlAnswer extends Mdl0Base<MdlAnswer> {
  protected static _collectionName: string = 'answers';
  // protected static _fieldNames: string[] = ['category', 'caption', 'specification', 'definition', 'args_and_answer'];

  get _question_id() { return this.data['question_id']; }
  set _question_id(value) { this.data['question_id'] = value; }

  get _answer() { return this.data['answer']; }
  set _answer(value) { this.data['answer'] = value; }
}
