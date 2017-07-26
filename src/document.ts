import * as QB from './types';

/**
 * Parsed graph of markup data.
 */
export default class QuestDocument {
    /**
     * Name of page that will be used as entrypoint. Dont use / change it directly.
     */
    public entry: string;

    /**
     * Map (<key, page>) of all quest pages. Dont use / change it directly.
     */
    public pages: { [Key: string]: QB.IQuestPage } = {};

    /**
     * Actual progress state, can be saved / loaded. Dont use / change it directly.
     */
    public state: QB.IQuestState = { currentPage: '', vars: {} };

    /**
     * Uses specified choice to activate redirection to new page.
     * @param id Choice number (zero-based) at choices list of current page.
     */
    public makeChoice(id: number) {
        const page = this.getCurrentPage();
        if (page) {
            const choice = page.choices[id];
            if (choice) {
                if (!choice.condition || this.processLogic(choice.condition)) {
                    this.setCurrentPage(choice.link);
                }
            }
        }
    }

    /**
     * Set specified page as current.
     * @param page Page name.
     */
    public setCurrentPage(page: string) {
        this.state.currentPage = page.toLowerCase();
    }

    /**
     * Requests data of current page. Will return undefined if page not exists.
     */
    public getCurrentPage(): QB.IQuestPage | undefined {
        return this.pages[this.state.currentPage];
    }

    /**
     * Reset actual progress to default values and entry point.
     */
    public resetState() {
        this.state.currentPage = this.entry;
        this.state.vars = {};
    }

    /**
     * Saves actual progress to JSON string.
     */
    public saveState(): string {
        return JSON.stringify(this.state);
    }

    /**
     * Tries to load new progress state from JSON string. Will throw exception on error.
     * @param jsonState New state ini JSON form.
     */
    public loadState(jsonState: string) {
        try {
            const loadedState = JSON.parse(jsonState);
            this.state.currentPage = this.state.currentPage.toLowerCase();
            this.state = loadedState;
        } catch (ex) {
            throw new Error(`State loading error: ${ex}`);
        }
    }

    /**
     * Returns variable value or zero if variable not exists.
     * @param name Variable name.
     */
    public getVariable(name: string): number {
        return this.state.vars[name.toLowerCase()] || 0;
    }

    /**
     * Sets new value to specified variable.
     * @param name Variable name.
     * @param val New value.
     */
    public setVariable(name: string, val: number) {
        name = name.toLowerCase();
        if (val) {
            this.state.vars[name] = val;
        } else {
            delete this.state.vars[name];
        }
    }

    /**
     * Tries to process specified logic. Will return result of conditional logic, or false for common states.
     * @param logic Logic block to process.
     */
    public processLogic(logic: QB.IQuestLogic): boolean {
        switch (logic.operator) {
            case '+=':
                this.setVariable(logic.lhs, this.getVariable(logic.lhs) + logic.rhs);
                return false;
            case '=':
                this.setVariable(logic.lhs, logic.rhs);
                return false;
            case '==':
                return this.getVariable(logic.lhs) === logic.rhs;
            case '!=':
                return this.getVariable(logic.lhs) !== logic.rhs;
            case '<':
                return this.getVariable(logic.lhs) < logic.rhs;
            case '>':
                return this.getVariable(logic.lhs) > logic.rhs;
            default:
                return false;
        }
    }

    /**
     * Tries to process text to builtin logic blocks (logics will be replace with calculated values).
     * @param text Text to process.
     */
    public processText(text: string): string {
        return text.replace(/\{\s*?(\w+)\s*?\}/g, (s, s1: string) => {
            return this.getVariable(s1.toLowerCase()).toString();
        });
    }
}