import IModel from "../../common/IModel.inteface";
import PlayerModel from '../player/PlayerModel.model';

class CategoryModel implements IModel {
    categoryId: number;
    name: string;

    players?: PlayerModel[];
}

export default CategoryModel;