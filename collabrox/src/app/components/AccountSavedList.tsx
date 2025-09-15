import profileEmpty from './../../assets/images/profile-empty.avif';
import { useDispatch } from 'react-redux';
import Typography from '../common/Typography';
import { MdClose } from 'react-icons/md';

const AccountSavedList = () => {
    const dispatch = useDispatch();


    return (
        <div className="w-full h-full flex items-start justify-center flex-col gap-10 rounded-lg text-gray-900">
            <div>
                <Typography variant="subheading">
                    Your recent logins
                </Typography>
                <Typography variant='p'>
                    Click on a profile to try login
                </Typography>
            </div>
            <div className="w-full flex flex-nowrap items-center justify-start gap-x-4 overflow-x-auto custom-scrollbar-css-sm">

            </div>
        </div>
    );
};

export default AccountSavedList;
