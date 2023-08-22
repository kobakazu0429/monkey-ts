import { type Obj } from "./object.js";

export class Environment {
  constructor(
    public store: Map<string, Obj> = new Map(),
    private outer?: Environment
  ) {}

  set(name: string, value: Obj): Obj {
    this.store.set(name, value);
    return value;
  }

  get(name: string): { obj: Obj; ok: true } | { ok: false } {
    if (this.store.has(name)) {
      return { obj: this.store.get(name)!, ok: true };
    }

    if (this.outer?.store.has(name)) {
      return { obj: this.outer?.store.get(name)!, ok: true };
    }

    return { ok: false };
  }

  static newEnclosedEnvironment(outer: Environment): Environment {
    const env = new Environment(new Map(), outer);
    return env;
  }
}
