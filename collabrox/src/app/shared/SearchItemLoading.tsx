const SearchItemLoading = ({ itemsCount = 6 }: { itemsCount?: number }) =>
    <>
      {Array.from({ length: itemsCount }, (_, i) => i + 1)
        .map((i) => (
          <div key={i} className="bg-gray-300">
            <div className="bg-white h-[110px] w-full mb-3">
              <div className="flex items-center gap-6 w-full h-full p-2">
                <div className="h-[68px] w-[80px] rounded-full bg-gray-300 animate-pulse"></div>
                <div className="flex flex-col w-full">
                  <div className="h-[15px] w-[70%] my-2 rounded-[8px] bg-gray-300 animate-pulse"></div>
                  <div className="h-[40px] w-[70%] rounded-[8px] bg-gray-300 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </>



export default SearchItemLoading