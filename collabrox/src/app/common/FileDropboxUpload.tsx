import React, { useRef, useState } from 'react'
import { uploadBytesResumable, getDownloadURL, ref as storageRef } from 'firebase/storage'
import { firebaseStorage } from '../../configs/firebaseConfig'
import { MdOutlineFileUpload } from 'react-icons/md'

// Define clear upload stages
type UploadStage =
    | 'Pending'
    | 'Uploading to Server'
    | 'Processing'
    | 'Uploading to Firebase'
    | 'Completed'

type FileType = 'image' | 'video' | 'file'

// Simplified progress tracking structure
type FileProgress = {
    fileName: string
    percentage: number
    status: UploadStage
}

type FirebaseUploadedFile = {
    fileName: string
    url: string
    metadata?: any
}

type Props = {
    fileType?: FileType
    totalFilesAllowed?: number
    maxSizeOfAFile?: number // bytes
    UPLOAD_URL: string
    firebaseFolder?: string
}

const FileDropboxUpload: React.FC<Props> = ({
    fileType = 'image',
    totalFilesAllowed = 2,
    maxSizeOfAFile = 10_000_000,
    UPLOAD_URL,
    firebaseFolder = 'uploads'
}) => {
    const [queueFiles, setQueueFiles] = useState<File[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [fileProgress, setFileProgress] = useState<FileProgress[]>([])
    const [firebaseFiles, setFirebaseFiles] = useState<FirebaseUploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Handle drag and drop events
    const handleDrop = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault()
        handleFiles(Array.from(ev.dataTransfer.files))
    }

    // Validate and process selected files
    const handleFiles = (files: File[]) => {
        setErrors([])
        const newErrors: string[] = []

        // Validate file count
        if (files.length > totalFilesAllowed) {
            newErrors.push(`Maximum ${totalFilesAllowed} files allowed`)
        }

        // Validate file sizes
        const oversizedFiles = files.filter(f => f.size > maxSizeOfAFile)
        if (oversizedFiles.length > 0) {
            newErrors.push(`Max file size: ${Math.round(maxSizeOfAFile / 1024 / 1024)}MB`)
        }

        // Update state with validation results
        if (newErrors.length > 0) {
            setErrors(newErrors)
        } else {
            setQueueFiles(files)
            initializeProgress(files)
        }
    }

    // Initialize progress tracking for new files
    const initializeProgress = (files: File[]) => {
        setFileProgress(files.map(file => ({
            fileName: file.name,
            percentage: 0,
            status: 'Pending'
        })))
    }

    // Handle file input changes
    const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(ev.target.files || [])
        handleFiles(files)
    }

    // Upload file to backend server
    const uploadToBackend = async (file: File, onProgress: (percent: number) => void): Promise<File> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            const formData = new FormData()
            formData.append('file', file)

            xhr.open('POST', UPLOAD_URL, true)

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = (event.loaded / event.total) * 100
                    onProgress(percent)
                }
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const convertedFile = convertFileFormat(xhr.response, file)
                    resolve(convertedFile)
                } else {
                    reject(new Error(`Server error: ${xhr.statusText}`))
                }
            }

            xhr.onerror = () => reject(new Error('Network error'))
            xhr.responseType = 'blob'
            xhr.send(formData)
        })
    }

    // Convert file format if needed (only for images)
    const convertFileFormat = (blob: Blob, originalFile: File): File => {
        if (fileType !== 'image') return originalFile

        const newFileName = originalFile.name.replace(/\.[^/.]+$/, ".avif")
        return new File([blob], newFileName, { type: "image/avif" })
    }

    // Upload file to Firebase storage
    const uploadToFirebase = async (file: File, onProgress: (percent: number) => void) => {
        const fileRef = storageRef(firebaseStorage, `${firebaseFolder}/${file.name}`)
        const uploadTask = uploadBytesResumable(fileRef, file)

        return new Promise<FirebaseUploadedFile>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    onProgress(percent)
                },
                reject,
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref)
                    resolve({
                        fileName: file.name,
                        url,
                        metadata: uploadTask.snapshot.metadata
                    })
                }
            )
        })
    }

    // Main upload handler
    const startUpload = async () => {
        if (!queueFiles.length) return

        setUploading(true)
        setErrors([])

        try {
            // Process files sequentially
            for (const file of queueFiles) {
                updateFileStatus(file.name, 'Uploading to Server', 0)

                // Step 1: Upload to backend server
                const processedFile = await uploadToBackend(file, (percent) => {
                    updateFileProgress(file.name, percent,
                        percent < 100 ? 'Uploading to Server' : 'Processing'
                    )
                })

                // Step 2: Upload to Firebase
                updateFileStatus(file.name, 'Uploading to Firebase', 100)
                const firebaseResult = await uploadToFirebase(processedFile, (percent) => {
                    updateFileProgress(file.name, percent,
                        percent < 100 ? 'Uploading to Firebase' : 'Completed'
                    )
                })

                // Save successful upload
                setFirebaseFiles(prev => [...prev, firebaseResult])
            }
        } catch (error: any) {
            setErrors(prev => [...prev, error.message])
        } finally {
            setUploading(false)
            setQueueFiles([])
        }
    }

    // Helper to update file progress
    const updateFileProgress = (fileName: string, percentage: number, status: UploadStage) => {
        setFileProgress(prev => prev.map(file =>
            file.fileName === fileName
                ? { ...file, percentage, status }
                : file
        ))
    }

    // Helper to update file status
    const updateFileStatus = (fileName: string, status: UploadStage, percentage: number) => {
        updateFileProgress(fileName, percentage, status)
    }

    // Calculate overall progress percentage
    const overallProgress = fileProgress.reduce(
        (sum, file) => sum + file.percentage,
        0
    ) / fileProgress.length || 0

    return (
        <div className="upload-container">
            {/* Drag and drop area */}
            <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={fileType === 'image' ? 'image/*' : fileType === 'video' ? 'video/*' : '*'}
                    className="hidden"
                    onChange={handleInputChange}
                />
                {/* Visual upload prompt */}
                <div className="upload-prompt">
                    <MdOutlineFileUpload />
                    <p>Drag files here or click to browse</p>
                    <small>
                        {`Max ${totalFilesAllowed} files (${Math.round(maxSizeOfAFile / 1024 / 1024)}MB each)`}
                    </small>
                </div>
            </div>

            {/* Error messages */}
            {errors.length > 0 && (
                <div className="error-container">
                    {errors.map((error, index) => (
                        <div key={index} className="error-message">{error}</div>
                    ))}
                </div>
            )}

            {/* Progress indicators */}
            {fileProgress.length > 0 && (
                <div className="progress-container">
                    {fileProgress.map((file) => (
                        <div key={file.fileName} className="file-progress">
                            <div className="progress-header">
                                <span>{file.fileName}</span>
                                <span>{file.status}</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${file.percentage}%` }}
                                />
                            </div>
                            <div className="progress-percentage">
                                {Math.round(file.percentage)}%
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload button */}
            <button
                className="upload-button"
                onClick={startUpload}
                disabled={uploading || !queueFiles.length}
            >
                {uploading ? `Uploading (${Math.round(overallProgress)}%)` : 'Start Upload'}
            </button>

            {/* Uploaded files list */}
            {firebaseFiles.length > 0 && (
                <div className="uploaded-files">
                    <h4>Successfully Uploaded:</h4>
                    <ul>
                        {firebaseFiles.map((file) => (
                            <li key={file.fileName}>
                                {file.fileName}
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    View
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default FileDropboxUpload