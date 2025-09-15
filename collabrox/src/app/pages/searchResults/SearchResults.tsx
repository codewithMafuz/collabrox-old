import { useLocation } from 'react-router-dom';
import { useLazyGetPersonSearchResultsQuery } from '../../../apis/searchApi';
import PageHeading from '../../common/Typography';
import pluralize from 'pluralize';
import { useEffect, useMemo, useState } from 'react';
import Pagination from '../../shared/Pagination';
import { capitalize } from '../../../lib/StringUtils';
import Typography from '../../common/Typography';
import PageWrapper from '../../shared/PageWrapper';
import { useNavigateCustom } from '../../../hooks/useNavigateCustom';
import ComponentWrapper from '../../common/ComponentWrapper';
import SearchItemLoading from '../../shared/SearchItemLoading';
import PersonItem from '../../shared/PersonItem';

const SearchResults = () => {
  const { search } = useLocation();
  const navigate = useNavigateCustom();

  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const query = useMemo(() => queryParams.get("query") ?? "", [queryParams]);

  // Track current page
  const [page, setPage] = useState<number>(
    Number(queryParams.get("page")) || 1
  );

  const [getPersonResults, { data: personData, isLoading }] =
    useLazyGetPersonSearchResultsQuery();

  const [results, setResults] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch results
  useEffect(() => {
    if (!query || query.length === 0 || query.length > 220) return;

    getPersonResults({ query, page: page.toString() })
      .unwrap()
      .then((resp: any) => {
        setResults(Array.isArray(resp?.data) ? resp.data : []);
        setTotalPages(resp?.totalPages || 1);
      });
    // eslint-disable-next-line
  }, [query, page]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const searchParams = new URLSearchParams(search);
    searchParams.set('page', newPage.toString());
    navigate({
      url: `/search?${searchParams.toString()}`,
      checkSearchToo: true,
      state: { prevPath: '/search' }
    });
  };

  return (
    <PageWrapper>
      <div className="bg-transparent flex-col items-center w-full py-1 md:py-4 my-0 pt-2">
        {query && (
          <ComponentWrapper>
            <div className="flex justify-between items-center px-1 md:px-2 lg:px-3 xl:px-4">
              <Typography variant='p' className='justify-self-start text-[1.2rem] lg:text-[1.3rem] ml-3'>
                Search results for
                <span className='w-full font-bold text-[1.3rem] lg:text-[1.4rem]'>
                  {' ' + query}
                </span>
              </Typography>
            </div>
          </ComponentWrapper>
        )}

        <div className="p-4 w-full flex flex-col rounded-lg">
          {!query ? (
            <PageHeading variant='heading' className='rounded-lg'>
              Start typing to search
            </PageHeading>
          ) : isLoading ? (
            <SearchItemLoading />
          ) : results.length > 0 ? (
            <>
              <div className='results'>
                <div>
                  <Typography variant='title' className='pl-3 font-[600]'>
                    {pluralize(capitalize("person"))}
                  </Typography>
                  <div className='mb-8 px-1'>
                    {results.map((obj: any) => (
                      <PersonItem
                        key={obj._id}
                        initialObj={obj}
                        isFollowing={obj.isFollowing}
                        followButton={true}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className='paginationBox mt-20 mb-10 bg-gray-50'>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onClick={handlePageChange}
                />
              </div>
            </>
          ) : (
            <PageHeading variant='heading' className='rounded-lg'>
              No results found
            </PageHeading>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default SearchResults;
