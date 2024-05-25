import { atom } from 'recoil';
import MdlQuestion from '../mdl/MdlQuestion';
import { useRecoilState as useRecoilStateOrigin } from "recoil";

export const useRecoilState = useRecoilStateOrigin;
export const stateQuestions = atom<{[key: string]: MdlQuestion[]}>({
  key: 'stateQuestions',
  default: {},
});