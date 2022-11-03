/**
 * DoubleLinkedListMap node model
 */
interface DoubleLinkedListNode<E> {
    value: E;
    prev?: DoubleLinkedListNode<E>;
    next?: DoubleLinkedListNode<E>;
}

/**
 * A special combination of linked lists and map
 * which allows to control the last accessed and last written values with fast node access by key.
 */
export class DoubleLinkedListMap<E> {

    /* Head node */
    private head?: DoubleLinkedListNode<E>;
    /* Tail node */
    private tail?: DoubleLinkedListNode<E>;

    /* All nodes */
    private nodes = new Map<string, DoubleLinkedListNode<E>>();

    /**
     * Retrieves value by key.
     * @param key - key
     */
    get(key: string): E | null {
        const node = this.nodes.get(key);
        if (node) {
            // Moving node to head as it was accessed?
            this.moveToHead(node);
            return node.value;
        }
        return null;
    }

    /**
     * Puts value by key.
     * @param key - key
     * @param value - node value
     */
    put(key: string, value: E): void {
        let node = this.nodes.get(key);
        if (node) {
            node.value = value; // Updating node value
            this.moveToHead(node); // Moving node to head since it was updated
        } else {
            node = {value}; // Creating new node
            this.addToHead(node); // Adding node to head since it was just created
            this.nodes.set(key, node); // Adding new node to nodes map
        }
    }

    /**
     * Removes value by key if exists.
     * @param key - node key
     */
    remove(key: string): void {
        const node = this.nodes.get(key);
        if (node) {
            this.detach(node);
            this.nodes.delete(key);
        }
    }

    /**
     * Head node value.
     */
    getHead(): E | undefined {
        return this.head?.value;
    }

    /**
     * Tail node value.
     */
    getTail(): E | undefined {
        return this.tail?.value;
    }

    /**
     * Returns size.
     */
    getSize(): number {
        return this.nodes.size;
    }

    /**
     * Deletes all nodes.
     */
    clear(): void {
        delete this.head;
        delete this.tail;
        this.nodes.clear();
    }

    /**
     * Detaches node from it's current position in the list:
     * [prev node]? <--> [current node] [X] <--> [next node]?
     *      ^becomes tail if next not exists          ^becomes head if prev not exists
     * [prev node]? <--> [next node]?
     */
    private detach(node: DoubleLinkedListNode<E>): void {
        const {prev, next} = node;
        if (prev) {
            prev.next = next;
        } else {
            this.head = next;
        }
        if (next) {
            next.prev = prev;
        } else {
            this.tail = prev;
        }
        delete node.next;
        delete node.prev;
    }

    /**
     * Adds new node to the head.
     * Moves the current head if exists.
     */
    private addToHead(node: DoubleLinkedListNode<E>): void {
        if (this.head) {
            this.head.prev = node;
        }
        node.next = this.head;
        this.head = node;
        if (!this.tail) {
            this.tail = this.head;
        }
    }

    /**
     * Moves existing node to the head.
     */
    private moveToHead(node: DoubleLinkedListNode<E>): void {
        this.detach(node);
        this.addToHead(node);
    }

}
