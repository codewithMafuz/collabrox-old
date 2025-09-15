import Typography from "../common/Typography"
import { SettingUserProps } from "../pages/settings/Settings"

function SettingAccount({ user }: { user: SettingUserProps }) {


    return (
        <div id="settingGeneral" className="w-full px-1 py-1">
            <div className="py-2">
                <Typography variant="subheading" className="text-gray-900">General</Typography>
            </div>
            <div className="pl-1">
                <div className="bg-gray-50 pl-1 my-2">
                    <Typography variant="p">Email</Typography>
                    <div className="border-t-[1px] border-gray-400"></div>
                    <div className="flex flex-col items-start justify-center">

                    </div>
                </div>
                <div className="bg-gray-50 pl-1 my-2">
                    <Typography variant="p">Password</Typography>
                    <div className="border-t-[1px] border-gray-400"></div>
                    <div className="flex flex-col items-start justify-center">

                    </div>
                </div>
            </div>
        </div>
    )
}

export default SettingAccount
