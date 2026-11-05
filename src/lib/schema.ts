import { z } from "zod";
// Runtime validation avoids Function/eval probes and works under the strict script CSP.
z.config({ jitless: true });
export { z };
