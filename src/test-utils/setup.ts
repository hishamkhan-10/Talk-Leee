import { ensureDom } from "@/test-utils/dom";

ensureDom();

(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

