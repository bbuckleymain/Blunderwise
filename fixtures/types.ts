import type { MistakeContext, MotifTag } from '../explain/types';

export interface Fixture {
  readonly id: string;
  readonly description: string;
  readonly expected: readonly MotifTag[];
  readonly alsoOk: readonly MotifTag[];
  readonly ctx: MistakeContext;
}
