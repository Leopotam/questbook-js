import * as QB from './types';
import QuestDocument from './document';

enum QuestLogicFilter {
    State,
    Expression
}

class QuestStream {
    public lines: string[];
    public pointer: number;
    constructor(markup: string) {
        this.lines = markup.split('\n');
        this.pointer = 0;
    }
    public eof(): boolean {
        return this.pointer >= this.lines.length;
    }
    public previous() {
        if (this.pointer > 0) { this.pointer--; }
    }
    public next(): string {
        if (this.eof()) { return ''; }
        const line = this.lines[this.pointer].trim();
        this.pointer++;
        return line.length > 0 && line.indexOf('//') !== 0 ? line : this.next();
    }
}

/**
 * Class-helper, provides api for loading / parsing quest markup data.
 */
export default abstract class QuestLoader {
    /**
     * Loads and parses quest markup data to QuestDocument.
     * No additional logical structure checks, use "validate" method for it.
     * @param markup Markup source of quest data.
     */
    public static loadMarkup(markup: string): QuestDocument {
        if (!markup) {
            throw new Error(`Invalid markup data`);
        }
        const stream = new QuestStream(markup);
        const doc = new QuestDocument();
        while (!stream.eof()) {
            const lineId = stream.pointer;
            const { page, name } = this.parsePage(stream);
            if (doc.pages[name]) {
                throw new Error(`Error at ${lineId} line: page with name "${name}" already declared before`);
            }
            doc.pages[name] = page;
            if (!doc.entry) {
                doc.entry = name;
            }
        }
        doc.resetState();
        return doc;
    }

    /**
     * Validates QuestDocument for possible errors. Exception will be thrown on any detected error.
     * @param doc Document to validate.
     */
    public static validate(doc: QuestDocument): void {
        const links: { [key: string]: boolean } = {};
        links[doc.entry] = true;
        for (const pageName in doc.pages) {
            if (doc.pages.hasOwnProperty(pageName)) {
                const page = doc.pages[pageName];
                if (!page) {
                    throw new Error(`Invalid page with name "${pageName}"`);
                }
                if (!page.texts || page.texts.length === 0) {
                    throw new Error(`Page "${pageName}": no texts`);
                }
                if (!page.choices || page.choices.length === 0) {
                    throw new Error(`Page "${pageName}": no choices`);
                }
                for (let i = 0; i < page.choices.length; i++) {
                    const link = page.choices[i].link;
                    if (link !== 'end') {
                        if (!doc.pages[link]) {
                            throw new Error(`Invalid link from page "${pageName}" to unknown "${link}"`);
                        }
                        links[link] = true;
                    }
                }
            }
        }
        for (const pageName in doc.pages) {
            if (!links[pageName]) {
                throw new Error(`Page without references: "${pageName}"`);
            }
        }
    }

    private static parsePage(stream: QuestStream): { page: QB.IQuestPage, name: string } {
        const matching = /->\s*?(\b.+)/.exec(stream.next());
        if (matching === null) {
            throw new Error(`Invalid page header at line: ${stream.pointer}, should be in "=> PageName" form`);
        }
        const name = matching[1].toLowerCase();
        if (name === 'end') {
            throw new Error(`Invalid page name at line: ${stream.pointer}, END is reserved page`);
        }
        const page: QB.IQuestPage = { texts: [], choices: [] };
        this.parsePageLogics(page, stream);
        this.parsePageTexts(page, stream);
        this.parsePageChoices(page, stream);
        return { page, name };
    }

    private static parsePageLogics(page: QB.IQuestPage, stream: QuestStream) {
        while (true) {
            const line = stream.next();
            if (line.length === 0) { break; }
            if (line[0] !== '{') { stream.previous(); break; }
            const matching = /\{(.+?)\}/.exec(line);
            if (matching === null || !matching[1]) {
                throw new Error(`Invalid logic at line: ${stream.pointer}`);
            }
            const cond = this.parseLogic(QuestLogicFilter.State, matching[1], stream.pointer);
            if (cond) {
                if (!page.logics) { page.logics = []; }
                page.logics.push(cond);
            }
        }
    }

    private static parsePageTexts(page: QB.IQuestPage, stream: QuestStream) {
        const buf: string[] = [];
        while (true) {
            const line = stream.next();
            if (line.length === 0) { break; }
            if (line[0] === '*' || line[0] === '-') { stream.previous(); break; }
            buf.push(line);
        }
        if (buf.length === 0) {
            throw new Error(`Invalid page texts at line: ${stream.pointer}`);
        }
        page.texts.push(...buf.join(' ').split(/\s?\[br\]\s?/));
    }

    private static parsePageChoices(page: QB.IQuestPage, stream: QuestStream) {
        let lineId = stream.pointer;
        while (true) {
            const line = stream.next();
            if (line.length === 0) { break; }
            if (line[0] !== '*') { stream.previous(); break; }
            const matching = /\*(.*?)->\s*?(\b.+)/.exec(line);
            if (matching === null) {
                throw new Error(`Invalid choice syntax at line: ${lineId}`);
            }
            lineId = stream.pointer;
            const choice: QB.IQuestChoice = {
                link: matching[2].toLowerCase()
            };
            const rawChoiceText = matching[1];
            if (rawChoiceText) {
                const matchingCond = /\{(.*?)\}(.+)/.exec(rawChoiceText);
                if (matchingCond === null) {
                    choice.text = rawChoiceText.trim();
                } else {
                    choice.condition = this.parseLogic(QuestLogicFilter.Expression, matchingCond[1], lineId);
                    choice.text = matchingCond[2].trim();
                }
            }
            page.choices.push(choice);
        }
        if (page.choices.length === 0) {
            throw new Error(`No choices at line: ${lineId}`);
        }
        if (page.choices.length === 1 && page.choices[0].condition) {
            throw new Error(`Auto choice cant use condition at line: ${lineId}`);
        }
    }

    private static parseLogic(filter: QuestLogicFilter, code: string, lineId: number): QB.IQuestLogic {
        const matchingFull = /(\w+)\s*(?:([<>=+!]+)\s*(-?\w+)?)?/.exec(code);
        if (matchingFull === null || (matchingFull[2] && !matchingFull[3])) {
            throw new Error(`Invalid logic syntax at line: ${lineId}`);
        }
        const lhs = matchingFull[1].toLowerCase();
        let operator: string;
        let rhs: number;
        if (matchingFull[3]) {
            operator = matchingFull[2];
            try {
                rhs = parseInt(matchingFull[3], 10);
            } catch (ex) {
                throw new Error(`Invalid expression at line: ${lineId}, only numbers supported on right side`);
            }
        } else {
            operator = '>';
            rhs = 0;
        }
        switch (operator) {
            case '+=':
            case '=':
                if (filter !== QuestLogicFilter.State) {
                    throw new Error(`Should be conditional expression at line: ${lineId}`);
                }
                break;
            case '!=':
            case '==':
            case '<':
            case '>':
                if (filter !== QuestLogicFilter.Expression) {
                    throw new Error(`Should be non conditional expression at line: ${lineId}`);
                }
                break;
            default:
                throw new Error(`Invalid logic operation at line: ${lineId}`);
        }
        return { lhs, operator, rhs };
    }
}