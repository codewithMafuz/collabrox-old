import PageWrapper from "../../shared/PageWrapper";
import Typography from "../../common/Typography";
import ComponentWrapper from "../../common/ComponentWrapper";
import { useNavigateCustom } from "../../../hooks/useNavigateCustom";
import { useEffect, useState } from "react";
import Autocomplete from "../../shared/Autocomplete";
import { isOneCharSlipped } from "../../../lib/StringUtils";
import ALL_ROUTES from "../../../routes";

const PageNotFound = () => {
    const navigate = useNavigateCustom()

    const [val, setVal] = useState<string>('')
    const [suggestions, setSuggestions] = useState<any[][]>([])

    useEffect(() => {
        let query = val.trim()
        const scoredSuggestions: { name: string, path: string, score: number }[] = []
        if (query) {
            ALL_ROUTES
                .filter(o => o.name)
                .forEach(obj => {
                    let score = 0
                    let name = obj.name?.toLowerCase()
                    let path = obj.path?.toLowerCase()
                    if (!name) return;

                    if (name.includes(val.toLowerCase())) score += 2;
                    if (name.split(' ').map(n => n.toLowerCase()).some(namePiece => query.split(' ').includes(namePiece))) score++
                    if (path.includes(val.toLowerCase())) score += 2;
                    if (query.length > 2 && isOneCharSlipped(name, query)) score++;

                    scoredSuggestions.push({ name, path, score })
                })
        }

        scoredSuggestions.sort((a, b) => b.score - a.score)

        setSuggestions(scoredSuggestions.map(o => Object.values({ name: o.name, path: o.path })))
    }, [val])

    return (
        <PageWrapper id="pageNotFound" className="flex flex-col items-center h-screen my-24">
            <ComponentWrapper className="p-3">
                <Typography variant="heading" className="font-bold my-4">404 - Not Found</Typography>
                <Typography variant="title" className="text-gray-600 my-2">Sorry, the page you're looking for doesn't exist.</Typography>

                <div className="relative my-2 flex items-center justify-center w-full max-w-md">
                    <Autocomplete
                        value={val}
                        onChange={setVal}
                        onSelect={selectedItem => {
                            setVal('');
                            navigate({ url: selectedItem[1], replace: true });
                        }}
                        suggestions={suggestions.slice(0, 4)}
                        placeholder="Search for page or content..."
                        className="w-full"
                        autoFocus
                    />
                </div>
            </ComponentWrapper>
        </PageWrapper>
    )
}

export default PageNotFound