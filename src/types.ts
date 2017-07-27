/**
 * Description of logic block data.
 */
export class QuestLogic {
    public operation: string;
    public lhs: string;
    public rhs: number;
}

/**
 * Description of choice data.
 */
export class QuestChoice {
    public text?: string;
    public link: string;
    public condition?: QuestLogic;
}

/**
 * Description of page data.
 */
export class QuestPage {
    public texts: string[] = [];
    public choices: QuestChoice[] = [];
    public logics?: QuestLogic[];
}

/**
 * Description of progress data.
 */
export class QuestProgress {
    public currentPage: string = '';
    public vars: { [key: string]: number } = {};
}