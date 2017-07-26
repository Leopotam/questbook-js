# Typescript / javascript implementation of interactive quest / book format / processing.

## installation
```
npm install -S questbook
```

## Usage
```
import { QuestLoader, QuestDocument } from 'questbook';
import * as fs from 'fs';

const markup = fs.readFileSync('./test.txt', 'utf8');
const parsedDoc = QuestLoader.loadMarkup(markup, true);
```

Full example of loading / processing quest data can be found at [examples repository](https://github.com/Leopotam/questbook-js-examples.git).