import { useState, useRef } from 'react';
import styles from './App.module.scss';

function App() {
  return (
    <>
      <h1>Plove Drills for Lapwing Theory</h1>
      <p>Select lesson: [lesson selector here]</p>
      <p>[1/n] Type this: example [accent hint here]</p>
      <p>
        <div className={styles.editor} contenteditable />
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
