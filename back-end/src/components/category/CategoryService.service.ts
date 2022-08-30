import CategoryModel from './CategoryModel.model';
import IAdapterOptions from '../../common/IAdapterOptions.interface';
import IAddCategory from './dto/IAddCategory.dto';
import BaseService from '../../common/BaseService';
import IEditCategory from './dto/IEditCategory.dto';
import { DefaultPlayerAdapterOptions } from '../player/PlayerService.service';

interface ICategoryAdapterOptions extends IAdapterOptions {
    loadPlayers: boolean;
}

const DefaultCategoryAdapterOptions : ICategoryAdapterOptions = {
    loadPlayers: false,
}

class CategoryService extends BaseService<CategoryModel, ICategoryAdapterOptions>{
    tableName(): string {
        return"category";
    }
    
    protected async adaptToModel(data: any, options: ICategoryAdapterOptions = DefaultCategoryAdapterOptions): Promise<CategoryModel> {
        const category: CategoryModel = new CategoryModel();

        category.categoryId = +data?.category_id;
        category.name = data?.name;

        if (options.loadPlayers) {
            // Async/Await pristup:
            category.players = await this.services.player.getAllByCategoryId(category.categoryId, DefaultPlayerAdapterOptions);
        }

        return category;
    }

    public async add(data: IAddCategory): Promise<CategoryModel> {
        return this.baseAdd(data, DefaultCategoryAdapterOptions);
    }

    public async editById(categoryId: number, data:IEditCategory, options: ICategoryAdapterOptions = DefaultCategoryAdapterOptions): Promise<CategoryModel> {
        return this.baseEditById(categoryId, data, options);
    }
}

export default CategoryService;
export {DefaultCategoryAdapterOptions};
