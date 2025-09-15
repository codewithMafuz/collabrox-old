import { useState } from 'react';
import PageWrapper from '../../shared/PageWrapper';
import Typography from '../../common/Typography';
import { MdOutlineWorkOutline, MdGroup, MdCode, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { FaLinkedin, FaGithub } from 'react-icons/fa';

const FAQ_ITEMS = [
    {
        question: "What is Collabrox?",
        answer: "Collabrox is a professional networking platform designed for developers, companies, and communities to connect, collaborate, and grow together. It provides a space for sharing opportunities, skills, and experiences."
    },
    {
        question: "How do I get started?",
        answer: "Simply sign up using any method like with your Email or GitHub or Google, complete your profile with your skills and experiences, and start connecting with other professionals, companies, and communities."
    },
    {
        question: "Is Collabrox free to use?",
        answer: "Yes, Collabrox is completely free to use at this moment and will be for very long time for sure. We believe in making professional networking accessible to everyone."
    },
    {
        question: "How can companies use Collabrox?",
        answer: "Companies can create profiles, post job opportunities, connect with potential candidates, and engage with relevant communities in their industry."
    },
    {
        question: "What makes Collabrox different?",
        answer: "Collabrox focuses specifically on the tech community, providing specialized features for developers and tech professionals. It allows your linkedin pdf to import, it also allows various features like github repository integrated showcase etc. Our platform emphasizes skills, project collaboration, and community building."
    }
];

const About = () => {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    return (
        <PageWrapper>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Hero Section */}
                <section className="text-center mb-16">
                    <Typography variant="heading" className="text-4xl mb-4">
                        Welcome to Collabrox
                    </Typography>
                    <Typography variant="subtitle" className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Connecting developers, companies, and communities in one collaborative ecosystem
                    </Typography>
                </section>

                {/* Features Section */}
                <section className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4">
                            <MdCode className="text-3xl text-indigo-600 mr-3" />
                            <h3 className="text-xl font-semibold">Developer Focused</h3>
                        </div>
                        <p className="text-gray-600">
                            Built specifically for developers to showcase skills, share experiences, and find opportunities.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4">
                            <MdOutlineWorkOutline className="text-3xl text-indigo-600 mr-3" />
                            <h3 className="text-xl font-semibold">Job Opportunities</h3>
                        </div>
                        <p className="text-gray-600">
                            Connect directly with companies and explore relevant job opportunities in tech.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4">
                            <MdGroup className="text-3xl text-indigo-600 mr-3" />
                            <h3 className="text-xl font-semibold">Community Driven</h3>
                        </div>
                        <p className="text-gray-600">
                            Join tech communities, participate in discussions, and grow your network.
                        </p>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="mb-16 bg-gray-50 p-8 rounded-lg">
                    <Typography variant="title" className="text-2xl mb-4 text-center">
                        Our Mission
                    </Typography>
                    <Typography variant="p" className="text-gray-600 text-center max-w-3xl mx-auto">
                        To create a thriving ecosystem where developers, companies, and communities can collaborate,
                        innovate, and grow together. We believe in making professional networking more accessible,
                        meaningful, and focused on what truly matters - skills and opportunities.
                    </Typography>
                </section>

                {/* FAQ Section */}
                <section className="mb-16">
                    <Typography variant="title" className="text-2xl mb-6 text-center">
                        Frequently Asked Questions
                    </Typography>
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {FAQ_ITEMS.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                                <button
                                    className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex items-center justify-between"
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                >
                                    <span className="font-semibold text-gray-900">{faq.question}</span>
                                    {expandedFaq === index ? (
                                        <MdExpandLess className="text-2xl text-gray-600" />
                                    ) : (
                                        <MdExpandMore className="text-2xl text-gray-600" />
                                    )}
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-6 py-4 bg-gray-50">
                                        <p className="text-gray-600">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Connect Section */}
                <section className="text-center">
                    <Typography variant="title" className="text-2xl mb-6">
                        Connect With Us
                    </Typography>
                    <div className="flex justify-center space-x-6">
                        <a
                            href="https://github.com/codewithMafuz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <FaGithub className="text-3xl" />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/mafuzur-rahman-126559215/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <FaLinkedin className="text-3xl" />
                        </a>
                    </div>
                </section>
            </div>
        </PageWrapper>
    );
};

export default About;
