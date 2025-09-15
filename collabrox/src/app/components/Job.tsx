import React from 'react'
import { useParams } from 'react-router-dom'

function Job() {
    const { slug, id } = useParams()
    // const {data : response, isFetching} = useLaz({slug, id})

    console.log({ slug, id })

    return (
        <div>
            Job
        </div>
    )
}

export default Job
