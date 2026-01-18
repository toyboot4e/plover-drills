import styles from './App.module.scss';
import { type Item, LessonSelector } from './LessonSelector.tsx';

const drillFiles = import.meta.glob('../drills/*.txt', { query: '?raw', eager: true });

const drills = Object.entries(drillFiles)
  .map(([path, text]) => ({
    name: path.split('/').pop()!,
    text,
  }))
  .sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

const items: Item[] = drills.map(({ name }, i) => {
  return { index: i, key: String(i), label: name };
});

const App = (): React.JSX.Element => {
  const onValueChange = ({ index }, _) => {
    console.log('->', index);
  };

  return (
    <>
      <h1>Plove Drills for Lapwing Theory</h1>
      <LessonSelector
        items={items}
        placeholder='Select drill'
        emptyString='No drill found'
        width='100%'
        onValueChange={onValueChange}
      />
      <p>[1/n] Type this: example [accent hint here]</p>
      <div className={styles.editor} contentEditable />
      <p>Show outline here on type error</p>
      <footer className={styles.footer}>
        This is a third-party app for <a href='https://lapwing.aerick.ca/'>Lapwing for Beginners</a>. Every lesson data
        comes from the book.
      </footer>
    </>
  );
};

export default App;
