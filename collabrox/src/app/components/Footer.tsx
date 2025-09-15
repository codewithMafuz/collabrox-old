import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import CusotmHr from "../common/CustomHr"
import Link from "../common/Link"

export default function Footer({ position = "static" }: { position?: 'static' | 'sticky' }) {
    const username = useSelector((state: RootState) => state.user.username)

    return (
        <footer style={{ position, top: 50 }} id="footer" className="w-full mt-10">
            <CusotmHr />
            <div className="flex items-center justify-around w-full py-10">
                <Link
                    to={`/${username || ''}`}
                    className="tracking-wide"
                > My profile
                </Link>
                <p className="tracking-wide">
                    © 2024 Copyright:
                    <a
                        rel="noreferrer"
                        className="hover:text-indigo-500"
                        target="_blank"
                        href='https://github.com/codewithMafuz/collabrox'>
                        Collabrox
                    </a>
                </p>
            </div>
        </footer >
    )
}