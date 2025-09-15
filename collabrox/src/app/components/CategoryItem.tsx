import PersonItem from '../shared/PersonItem'
import { SearchCategories } from '../pages/searchResults/SearchResults'

interface CategoryItemProps {
    type: SearchCategories;
    initialObj: any;
    [key: string]: any;
}

const CategoryItem = ({ type, initialObj, ...otherProps }: CategoryItemProps) => {
    switch (type) {
        case 'person':
            return <PersonItem initialObj={initialObj} {...otherProps} />
        default:
            return <PersonItem initialObj={initialObj} {...otherProps} />
    }
}

export default CategoryItem
export {
    PersonItem
}