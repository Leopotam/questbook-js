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
    public pages: { [Key: string]: QB.QuestPage } = {};

    /**
     * Actual progress state, can be saved / loaded. Dont use / change it directly.
     */
    public state: QB.QuestProgress = new QB.QuestProgress();

    /**
     * Uses specified choice to activate redirection to new page.
     * @param choice Choice to redirect.
     */
    public makeChoice(choice: QB.QuestChoice) {
        if (this.isChoiceVisible(choice)) {
            this.setCurrentPage(choice.link);
        }
    }

    /**
     * Checks for auto execution single choice without text and process it if requires.
     * Will return success of this check & execution.
     * @param page Page to check.
     */
    public makeAutoChoice(page: QB.QuestPage): boolean {
        if (page.choices.length === 1 && !page.choices[0].text) {
            this.setCurrentPage(page.choices[0].link);
            return true;
        }
        return false;
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
    public getCurrentPage(): QB.QuestPage | undefined {
        return this.pages[this.state.currentPage];
    }

    /**
     * Reset actual progress to default values and entry point.
     */
    public resetProgress() {
        this.state.currentPage = this.entry;
        this.state.vars = {};
    }

    /**
     * Returns actual progress.
     */
    public getProgress(): QB.QuestProgress {
        return this.state;
    }

    /**
     * Tries to load new progress state.
     * @param progress New progress state
     */
    public setProgress(progress: QB.QuestProgress) {
        try {
            progress.currentPage = progress.currentPage.toLowerCase();
            if (!progress.vars) { throw new Error(); }
            this.state = progress;
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
    public processLogic(logic: QB.QuestLogic): boolean {
        switch (logic.operation) {
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

    /**
     * Checks choice visibility with respect optional condition.
     * @param choice Choice to test.
     */
    public isChoiceVisible(choice: QB.QuestChoice): boolean {
        return choice && (!choice.condition || this.processLogic(choice.condition));
    }
}