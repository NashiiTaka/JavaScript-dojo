import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './MyMarkdonw.module.css';

export const mkdAppliedClassName = styles.markdown;

export default function MyMarkdonw({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} className={styles.markdown}>
      {children}
    </ReactMarkdown>
  )
}