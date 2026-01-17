import { useState } from 'react';
import styles from './App.module.scss';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Plove Drills for Lapwing Theory</h1>
      <textarea></textarea>
      <p>
        <div className={styles.editor} contentEditable placeholder='Type here'></div>
      </p>
      <footer className={styles.footer}>
        This is a third-party app for <a href='https://lapwing.aerick.ca/'>Lapwing for Beginners</a>. Every lesson data
        comes from the book.
      </footer>
    </>
  );
}

export default App;
