
import express from "express"
import { createBuilder, delBuilder, editBuilder, getAllBuilder, getInDetailBuilder } from "../controller/builderController";
import { validateBody } from "../middlewares/validate";
import { createBuilderSchema } from "../zod/validation";

export const  builderRouter =  express.Router()

builderRouter.post('/', validateBody(createBuilderSchema), createBuilder);
builderRouter.get('/', getAllBuilder);
builderRouter.get('/:id',  getInDetailBuilder);
builderRouter.patch('/:id', validateBody(createBuilderSchema), editBuilder);
builderRouter.delete('/:id', delBuilder);



export default builderRouter;