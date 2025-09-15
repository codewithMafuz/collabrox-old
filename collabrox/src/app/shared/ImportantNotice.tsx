import { memo } from 'react'
import Typography from '../common/Typography'
import Button from '../common/Button'
import Link from '../common/Link'

const AppMaintenanceNotice = memo(() => {
    const handleRedirect = () => {
        // Replace with your actual new app URL
        window.location.href = 'https://new-version.your-app.com'
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Icon or Logo */}
                <div className="mb-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                        <svg
                            className="w-8 h-8 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Main Message */}
                <Typography variant="heading" className="mb-4 text-gray-900">
                    We've Moved to a New Version
                </Typography>

                <Typography variant="subheading" className="mb-6 text-gray-600">
                    This version of the app is no longer maintained. Please move to our new
                    and improved version where all your accounts, content, and data will
                    work seamlessly.
                </Typography>

                {/* Benefits */}
                <div className="mb-8 text-left">
                    <div className="flex items-center mb-2">
                        <svg
                            className="w-5 h-5 text-green-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <Typography variant="subheading" className="text-gray-600">
                            All your accounts and data preserved
                        </Typography>
                    </div>
                    <div className="flex items-center mb-2">
                        <svg
                            className="w-5 h-5 text-green-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <Typography variant="subheading" className="text-gray-600">
                            Enhanced features and performance
                        </Typography>
                    </div>
                    <div className="flex items-center">
                        <svg
                            className="w-5 h-5 text-green-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <Typography variant="subheading" className="text-gray-600">
                            Same great experience, better technology
                        </Typography>
                    </div>
                </div>

                {/* Action Button */}
                <a
                    href='https://www.collabrox.vercel.app'
                    target='_blank'
                >
                    <Button
                        sz="lg"
                        className="w-full mb-4"
                    >
                        Go to New Version
                    </Button>
                </a>

                {/* Contact Info */}
                <Typography variant="subheading" className="text-gray-500">
                    Need help?{' '}
                    <a
                        href="mailto:support@your-app.com"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        Contact support
                    </a>
                </Typography>
            </div>
        </div>
    )
})

export default AppMaintenanceNotice