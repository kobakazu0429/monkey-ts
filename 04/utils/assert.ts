export type Class<T = unknown> = { new (...args: any[]): T };

export function assertInstanceof<T extends Class>(
  v: unknown,
  instance: T,
  target = ""
): asserts v is InstanceType<T> {
  if (!(v instanceof instance)) {
    throw new Error(
      `${target} should be instanceof ${instance.name}, but ${v?.constructor.name}`.trim()
    );
  }
}
