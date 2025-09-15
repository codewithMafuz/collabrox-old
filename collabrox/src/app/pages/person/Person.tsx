import { useEffect, useState } from "react";
import PersonTopSection from "../../components/PersonTopSection";
import { useParams } from "react-router-dom";
import { useLazyGetPersonItemQuery } from "../../../apis/personApi";
import { useDispatch } from "react-redux";
import { setUserData } from "../userSlice";
import { resetPersonState, setPersonData } from "./personSlice";
import AboutInfo from "../../components/AboutInfo";
import Skills from "../../components/Skills";
import Experience from "../../components/Experiences";
import PageWrapper from "../../shared/PageWrapper";
import useShowToast from "../../../hooks/useShowToast";

export const isFirebaseImageUrl = (profileSrc: string = '') =>
    profileSrc &&
    profileSrc.includes('alt=media') &&
    profileSrc.includes('token=')

const Person = () => {
    const dispatch = useDispatch();
    const showToast = useShowToast()

    const { username: personUsername } = useParams();

    const [fetchPerson, { data: personResponse }] = useLazyGetPersonItemQuery();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (personUsername && /^[a-zA-Z0-9_-]{2,64}$/.test(personUsername)) {
            dispatch(resetPersonState());
            fetchPerson(personUsername);
        } else {
            showToast('Invalid username')
        }
    }, [personUsername]);

    useEffect(() => {
        let isMounted = true;

        const { status, message, data } = personResponse || {};
        if (status) {
            if (status === 'Failed') {
                if (message === 'User not found') {
                    showToast(message)
                }
            } else {
                if (isMounted) setIsLoading(true);
                if (data) {
                    const profileSrcSm = data.profileSrcSm
                    dispatch(setPersonData({
                        ...data,
                        userId: data._id,
                        profileSrcSm
                    }));
                    
                    if (data.isSelfProfile) {
                        dispatch(setUserData({
                            _id: data._id,
                            username: data.username,
                            profileSrcSm
                        }));
                    }
                }
                if (isMounted) setIsLoading(false);
            }
        }

        return () => {
            isMounted = false;
        };
    }, [personResponse, dispatch]);

    return (
        <PageWrapper id="person" className="w-full h-auto">
            {isLoading ? (
                // Profile page fetching animation
                <div className="mt-2 h-[80vh]">
                    <div className="animate-pulse bg-white w-full h-[40vh] rounded-lg mb-2"></div>
                    <div className="animate-pulse bg-white w-full h-[10vh] rounded-md mb-2"></div>
                    <div className="animate-pulse bg-white w-[80%] h-[6vh] rounded-sm mb-1"></div>
                    <div className="animate-pulse bg-white w-[80%] h-[6vh] rounded-sm"></div>
                </div>
            ) : (
                <div className="sections flex flex-col gap-y-6 pb-8">
                    <PersonTopSection />
                    <AboutInfo />
                    <Skills />
                    <Experience />
                </div>
            )}
        </PageWrapper>
    );
}


export default Person