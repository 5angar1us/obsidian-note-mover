type Task<T> = () => Promise<T> | T;
type TaskQueueItem<T> = {
  task: Task<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

export class PromisePool {
  private max: number;
  private queue: TaskQueueItem<unknown>[];
  private running: number;

  constructor(maxConcurrency: number) {
    this.max = Math.max(1, maxConcurrency || 1);
    this.queue = [];
    this.running = 0;
  }

  add<T>(task: Task<T>): Promise<T> {
    if (typeof task !== 'function') {
      return Promise.reject(new Error('Task must be a function'));
    }
    
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  private next(): void {
    while (this.running < this.max && this.queue.length) {
      const { task, resolve, reject } = this.queue.shift()!;
      this.running++;
      
      Promise.resolve()
        .then(() => task())
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this.next();
        });
    }
  }

  reset(): void {
    const error = new Error('Pool was reset');
    this.queue.forEach(({ reject }) => reject(error));
    this.queue = [];
  }

  async waitAll(): Promise<void> {
    if (this.running === 0 && this.queue.length === 0) {
      return;
    }
    
    return new Promise<void>(resolve => {
      const checkComplete = () => {
        if (this.running === 0 && this.queue.length === 0) {
          resolve();
        } else {
          setTimeout(checkComplete, 10);
        }
      };
      checkComplete();
    });
  }


  getRunningCount(): number {
    return this.running;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}