import z from "zod";
import { base } from "../middleware";

export const logPublicPayload = base.input(z.object({})).handler(async ({ input }) => {
    console.log(`The Payload is: ${JSON.stringify(input)}`);
})