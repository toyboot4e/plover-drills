import styles from './App.module.scss';
import { type Item, LessonSelector } from './LessonSelector.tsx';

const items: Item[] = [{ label: 'Apple', value: 'apple' }];

function App() {
  return (
    <>
      <h1>Plove Drills for Lapwing Theory</h1>
      <LessonSelector items={items} placeholder='Select drill' emptyString='No drill found' />
      <p>[1/n] Type this: example [accent hint here]</p>
      <p>
        <div className={styles.editor} contentEditable />
      </p>
      <p>Show outline here on type error</p>
      <footer className={styles.footer}>
        This is a third-party app for <a href='https://lapwing.aerick.ca/'>Lapwing for Beginners</a>. Every lesson data
        comes from the book.
      </footer>
    </>
  );
}

export default App;
