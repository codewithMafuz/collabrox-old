import { memo, useState, useCallback, useEffect } from 'react'
import { useGetSimilarPersonsItemsQuery } from '../../apis/personApi'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Typography from '../common/Typography'
import { RootState } from '../../store/store'
import PersonItem from './../shared/PersonItem'
import ComponentWrapper from '../common/ComponentWrapper'
import ButtonArrowUpDown from '../common/ButtonArrowUpDown'

const SimilarPersonItems = memo(() => {
    const { username = '' } = useParams()
    const { isSelfProfile, name } = useSelector((state: RootState) => state.person)
    const { data: response, isFetching, refetch } = useGetSimilarPersonsItemsQuery({ username })
    const data = response?.data

    const [itemsHidden, setItemsHidden] = useState<boolean>(false)
    const [hideComp, setHideComp] = useState<boolean>(false)

    // Automatically hide component if there's no data and not fetching
    useEffect(() => {
        if (!isFetching && (!data || data.length === 0)) {
            setHideComp(true)
        } else {
            setHideComp(false)
        }
    }, [data, isFetching])

    const handleRetry = useCallback(() => {
        refetch()
    }, [refetch])

    // Don't render anything while fetching or if component should be hidden
    if (hideComp || isFetching) return null

    return (
        <ComponentWrapper
            id="sidebar-similarity"
            style={{
                minHeight: itemsHidden ? 'unset' : 'calc(100vh - 200px)',
            }}
            className="w-full py-2 flex flex-col mt-1 mb-3"
        >
            <div className="flex items-center justify-between mb-2 px-1 sm:px-2 md:px-3">
                <Typography variant="title" className="mb-0">
                    Similar like {isSelfProfile ? 'You' : name}
                </Typography>
                <ButtonArrowUpDown
                    title=""
                    sz="lg"
                    col="light"
                    reverse={true}
                    onClickOnDown={() => setItemsHidden(true)}
                    onClickOnUp={() => setItemsHidden(false)}
                    tooltipConfig={{
                        content: itemsHidden ? 'Expand' : 'Hide',
                        className: 'position-left',
                        arrowClassName: 'rightside-middle',
                    }}
                />
            </div>

            {!itemsHidden && (
                <div className="flex-1 flex flex-col">
                    {data?.map((personItem, index) => (
                        <PersonItem
                            key={index}
                            initialObj={personItem}
                            isFollowing={personItem.isFollowing}
                            followButton={true}
                        />
                    ))}
                </div>
            )}
        </ComponentWrapper>
    )
})

export default SimilarPersonItems