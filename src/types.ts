export enum QuestLogicFilter {
    State,
    Expression
}

export interface IQuestLogic {
    operator: string;
    lhs: string;
    rhs: number;
}

export interface IQuestChoice {
    text?: string;
    link: string;
    condition?: IQuestLogic;
}

export interface IQuestPage {
    texts: string[];
    choices: IQuestChoice[];
    logics?: IQuestLogic[];
}

export interface IQuestState {
    currentPage: string;
    vars: { [key: string]: number };
}