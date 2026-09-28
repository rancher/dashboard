import { Extension, ChangeDesc } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

declare function emacs(options?: {}): Extension;
declare type EmacsMark = number[] | null | undefined;
declare class EmacsHandler {
    readonly view: EditorView;
    static bindKey(keyGroup: string, command: any): void;
    static getKey(e: KeyboardEvent): string[];
    static commands: Record<string, any>;
    static addCommands(commands: any): void;
    static execCommand(command: any, handler: EmacsHandler, args: any, count?: number): any;
    handleKeyboard(e: KeyboardEvent): {
        command: string;
        args: string;
        count?: undefined;
    } | {
        command: string;
        args?: undefined;
        count?: undefined;
    } | {
        command: any;
        args: any;
        count: number;
    } | undefined;
    constructor(view: EditorView);
    $data: {
        count?: number | null;
        keyChain: string;
        lastCommand: string | null;
    };
    findCommand([key, modifier, text]: string[]): {
        command: string;
        args: string;
        count?: undefined;
    } | {
        command: string;
        args?: undefined;
        count?: undefined;
    } | {
        command: any;
        args: any;
        count: number;
    } | undefined;
    showCommandLine(text: string): void;
    $emacsMarkRing: EmacsMark[];
    $emacsMark?: EmacsMark;
    updateMarksOnChange(change: ChangeDesc): void;
    updateMark(mark: EmacsMark, change: ChangeDesc): number[] | null | undefined;
    emacsMark(): EmacsMark;
    setEmacsMark(p?: EmacsMark): void;
    pushEmacsMark(p?: EmacsMark, activate?: boolean): void;
    popEmacsMark(): EmacsMark;
    getLastEmacsMark(): EmacsMark;
    getCopyText(): string;
    clearSelection(): boolean;
    onPaste(text: string): void;
    selectionToEmacsMark(): number[];
}
declare const emacsKeys: Record<string, any>;

export { EmacsHandler, emacs, emacsKeys };
