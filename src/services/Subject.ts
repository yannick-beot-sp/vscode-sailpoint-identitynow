import { Observer } from "./Observer";

export interface Subject<EventType, MessageType> {

    registerObserver(t: EventType, o: Observer<EventType, MessageType>): void

    removeObserver(t: EventType, o: Observer<EventType, MessageType>): void

    notifyObservers(t: EventType, message: MessageType): void | Promise<void>

}