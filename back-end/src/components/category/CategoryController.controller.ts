import { DefaultCategoryAdapterOptions } from './CategoryService.service';
import {Request, response, Response} from "express";
import IAddCategory, { AddCategoryValidator } from './dto/IAddCategory.dto';
import { EditCategoryValidator, IEditCategoryDto } from './dto/IEditCategory.dto';
import BaseController from '../../common/BaseController';

class CategoryController extends BaseController {
    
    async getAll(req: Request, res: Response) {
        this.services.category.getAll(DefaultCategoryAdapterOptions)
        .then(result =>{
            res.send(result);
        })
        .catch(error =>{
            res.status(500).send(error?.message);
        });
    }

    async getById(req: Request, res: Response) {
        const id: number = +req.params?.id;

        this.services.category.getById(id, {
            loadPlayers: true,
        })
        .then(result => {
            if (result === null) {
                return res.sendStatus(404);
            }

            res.send(result);
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });

    }

    async add(req: Request, res: Response) {
        const data = req.body as IAddCategory;

        if (!AddCategoryValidator(data)) {
            return res.status(400).send(AddCategoryValidator.errors);
        }

        this.services.category.add(data)
        .then(result =>{
            res.send(result);
        })
        .catch(error => {
            res.status(400).send(error?.message);
        });
    }

    async edit(req: Request, res: Response) {
        const id: number = +req.params?.cid;
        const data = req.body as IEditCategoryDto;

        if (!EditCategoryValidator(data)) {
            return res.status(400).send(EditCategoryValidator.errors);
        }

        this.services.category.getById(id, {
            loadPlayers: false
        })
            .then(result => {
                if (result === null) {
                    return res.sendStatus(404);
                }

               this.services.category.editById(id, data)
               .then(result =>{
                    res.send(result);
               })
               .catch(error =>{
                   res.status(400).send(error?.message);
               })
            })
            .catch(error => {
                res.status(500).send(error?.message);
            });
    }
}

export default CategoryController;
