import * as QB from './types';

export default class QuestDocument {
    public entry: string;
    public pages: { [Key: string]: QB.IQuestPage } = {};
    public state: QB.IQuestState = { currentPage: '', vars: {} };

    public makeChoice(id: number) {
        const page = this.getCurrentPage();
        if (page) {
            const choice = page.choices[id];
            if (choice) {
                if (!choice.condition || this.processLogic(choice.condition)) {
                    this.openPage(choice.link);
                }
            }
        }
    }

    public openPage(page: string) {
        this.state.currentPage = page;
    }

    public resetState() {
        this.state.currentPage = this.entry;
        this.state.vars = {};
    }

    public saveState(): string {
        return JSON.stringify(this.state);
    }

    public loadState(jsonState: string) {
        try {
            const loadedState = JSON.parse(jsonState);
            this.state.currentPage = this.state.currentPage.toLowerCase();
            this.state = loadedState;
        } catch (ex) {
            throw new Error(`State loading error: ${ex}`);
        }
    }

    public getCurrentPage(): QB.IQuestPage | undefined {
        return this.pages[this.state.currentPage];
    }

    public processLogic(logic: QB.IQuestLogic): boolean {
        switch (logic.operator) {
            case '+=':
                const val = (this.state.vars[logic.lhs] || 0) + logic.rhs;
                if (val !== 0) {
                    this.state.vars[logic.lhs] = val;
                } else {
                    delete this.state.vars[logic.lhs];
                }
                return false;
            case '=':
                if (logic.rhs !== 0) {
                    this.state.vars[logic.lhs] = logic.rhs;
                } else {
                    delete this.state.vars[logic.lhs];
                }
                return false;
            case '==':
                return (this.state.vars[logic.lhs] || 0) === logic.rhs;
            case '!=':
                return (this.state.vars[logic.lhs] || 0) !== logic.rhs;
            case '<':
                return (this.state.vars[logic.lhs] || 0) < logic.rhs;
            case '>':
                return (this.state.vars[logic.lhs] || 0) > logic.rhs;
            default:
                return false;
        }
    }

    public processText(text: string): string {
        return text.replace(/\{\s*?(\w+)\s*?\}/g, (s, s1: string) => {
            return (this.state.vars[s1.toLowerCase()] || 0).toString();
        }); // .split(/\s+?\[br\]\s+?/g);
    }
}