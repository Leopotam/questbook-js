/**
 * Description of logic block data.
 */
export interface IQuestLogic {
    operator: string;
    lhs: string;
    rhs: number;
}

/**
 * Description of choice data.
 */
export interface IQuestChoice {
    text?: string;
    link: string;
    condition?: IQuestLogic;
}

/**
 * Description of page data.
 */
export interface IQuestPage {
    texts: string[];
    choices: IQuestChoice[];
    logics?: IQuestLogic[];
}

/**
 * Description of progress data.
 */
export interface IQuestState {
    currentPage: string;
    vars: { [key: string]: number };
}