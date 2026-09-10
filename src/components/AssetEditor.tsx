'use client'

import { useState, useTransition } from 'react'
import { updateAsset } from '@/actions/campaign'

interface AssetEditorProps {
  asset: {
    id: string
    channel: string
    stage: string
    assetType: string
    title?: string | null
    content: any
    manuallyEdited: boolean
    version: number
  }
  onSaveSuccess?: () => void
}

/**
 * AssetEditor Component
 * 
 * Provides inline editing for campaign assets with the following features:
 * - Textarea input for content editing
 * - Save/Cancel actions
 * - Loading states during save
 * - Save confirmation feedback
 * - Persists changes within 2 seconds per Req 8.3
 * 
 * Requirements: 8.3
 * 
 * @param asset - The asset to edit
 * @param onSaveSuccess - Optional callback after successful save
 */
export function AssetEditor({ asset, onSaveSuccess }: AssetEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<any>(asset.content)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Handle edit mode toggle
  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSaveSuccess(false)
  }

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false)
    setEditedContent(asset.content)
    setError(null)
    setSaveSuccess(false)
  }

  // Handle save
  const handleSave = () => {
    setError(null)
    setSaveSuccess(false)

    startTransition(async () => {
      try {
        // Serialize content to JSON string
        const contentJson = JSON.stringify(editedContent)

        // Call updateAsset server action
        const result = await updateAsset(asset.id, contentJson)

        if (result.success) {
          setSaveSuccess(true)
          setIsEditing(false)

          // Hide success message after 3 seconds
          setTimeout(() => {
            setSaveSuccess(false)
          }, 3000)

          // Call success callback if provided
          if (onSaveSuccess) {
            onSaveSuccess()
          }
        } else {
          setError(result.error || 'Failed to save changes')
        }
      } catch (err) {
        console.error('Save error:', err)
        setError(err instanceof Error ? err.message : 'Failed to save changes')
      }
    })
  }

  // Handle content field changes based on asset type
  const handleContentChange = (field: string, value: string) => {
    setEditedContent({
      ...editedContent,
      [field]: value
    })
  }

  // Render edit fields based on asset type
  const renderEditFields = () => {
    if (asset.assetType === 'post') {
      // LinkedIn post
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 mb-1">
              Post Content
            </label>
            <textarea
              id="post-content"
              value={editedContent.content || ''}
              onChange={(e) => handleContentChange('content', e.target.value)}
              className="w-full min-h-[300px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Enter post content..."
              maxLength={3000}
            />
            <p className="mt-1 text-xs text-gray-500">
              {(editedContent.content || '').length} / 3,000 characters
            </p>
          </div>
          <div>
            <label htmlFor="strategic-purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Strategic Purpose
            </label>
            <textarea
              id="strategic-purpose"
              value={editedContent.strategicPurpose || ''}
              onChange={(e) => handleContentChange('strategicPurpose', e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Strategic purpose..."
            />
          </div>
        </div>
      )
    } else if (asset.assetType === 'email') {
      // Email
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="subject-line" className="block text-sm font-medium text-gray-700 mb-1">
              Subject Line
            </label>
            <input
              id="subject-line"
              type="text"
              value={editedContent.subjectLine || ''}
              onChange={(e) => handleContentChange('subjectLine', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Subject line..."
              maxLength={60}
            />
            <p className="mt-1 text-xs text-gray-500">
              {(editedContent.subjectLine || '').length} / 60 characters
            </p>
          </div>
          <div>
            <label htmlFor="preview-text" className="block text-sm font-medium text-gray-700 mb-1">
              Preview Text
            </label>
            <input
              id="preview-text"
              type="text"
              value={editedContent.previewText || ''}
              onChange={(e) => handleContentChange('previewText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Preview text..."
              maxLength={90}
            />
            <p className="mt-1 text-xs text-gray-500">
              {(editedContent.previewText || '').length} / 90 characters
            </p>
          </div>
          <div>
            <label htmlFor="email-body" className="block text-sm font-medium text-gray-700 mb-1">
              Body
            </label>
            <textarea
              id="email-body"
              value={editedContent.body || ''}
              onChange={(e) => handleContentChange('body', e.target.value)}
              className="w-full min-h-[300px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Email body..."
            />
            <p className="mt-1 text-xs text-gray-500">
              {(editedContent.body || '').trim().split(/\s+/).length} words
            </p>
          </div>
          <div>
            <label htmlFor="email-cta" className="block text-sm font-medium text-gray-700 mb-1">
              Call to Action
            </label>
            <input
              id="email-cta"
              type="text"
              value={editedContent.cta || ''}
              onChange={(e) => handleContentChange('cta', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="CTA text..."
            />
          </div>
          <div>
            <label htmlFor="email-strategic-purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Strategic Purpose
            </label>
            <textarea
              id="email-strategic-purpose"
              value={editedContent.strategicPurpose || ''}
              onChange={(e) => handleContentChange('strategicPurpose', e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Strategic purpose..."
            />
          </div>
        </div>
      )
    } else if (asset.assetType === 'ad') {
      // Ad concept
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="ad-headline" className="block text-sm font-medium text-gray-700 mb-1">
              Headline
            </label>
            <input
              id="ad-headline"
              type="text"
              value={editedContent.headline || ''}
              onChange={(e) => handleContentChange('headline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Ad headline..."
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="ad-primary-text" className="block text-sm font-medium text-gray-700 mb-1">
              Primary Text
            </label>
            <textarea
              id="ad-primary-text"
              value={editedContent.primaryText || ''}
              onChange={(e) => handleContentChange('primaryText', e.target.value)}
              className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Ad text..."
              maxLength={300}
            />
            <p className="mt-1 text-xs text-gray-500">
              {(editedContent.primaryText || '').length} / 300 characters
            </p>
          </div>
          <div>
            <label htmlFor="ad-cta" className="block text-sm font-medium text-gray-700 mb-1">
              Call to Action
            </label>
            <input
              id="ad-cta"
              type="text"
              value={editedContent.cta || ''}
              onChange={(e) => handleContentChange('cta', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="CTA text..."
            />
          </div>
          <div>
            <label htmlFor="ad-target-audience" className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience
            </label>
            <input
              id="ad-target-audience"
              type="text"
              value={editedContent.targetAudience || ''}
              onChange={(e) => handleContentChange('targetAudience', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Target audience..."
            />
          </div>
          <div>
            <label htmlFor="ad-rationale" className="block text-sm font-medium text-gray-700 mb-1">
              Rationale
            </label>
            <textarea
              id="ad-rationale"
              value={editedContent.rationale || ''}
              onChange={(e) => handleContentChange('rationale', e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Why this angle works..."
            />
          </div>
        </div>
      )
    } else if (asset.assetType === 'page_section') {
      // Landing page - simplified editor for main sections
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="lp-headline" className="block text-sm font-medium text-gray-700 mb-1">
              Headline
            </label>
            <input
              id="lp-headline"
              type="text"
              value={editedContent.headline || ''}
              onChange={(e) => handleContentChange('headline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Headline..."
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="lp-subheadline" className="block text-sm font-medium text-gray-700 mb-1">
              Subheadline
            </label>
            <input
              id="lp-subheadline"
              type="text"
              value={editedContent.subheadline || ''}
              onChange={(e) => handleContentChange('subheadline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Subheadline..."
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="lp-primary-cta" className="block text-sm font-medium text-gray-700 mb-1">
              Primary CTA
            </label>
            <input
              id="lp-primary-cta"
              type="text"
              value={editedContent.primaryCTA || ''}
              onChange={(e) => handleContentChange('primaryCTA', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Primary CTA..."
            />
          </div>
          <div>
            <label htmlFor="lp-problem-section" className="block text-sm font-medium text-gray-700 mb-1">
              Problem Section
            </label>
            <textarea
              id="lp-problem-section"
              value={editedContent.problemSection || ''}
              onChange={(e) => handleContentChange('problemSection', e.target.value)}
              className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Problem section..."
            />
          </div>
          <div>
            <label htmlFor="lp-product-solution" className="block text-sm font-medium text-gray-700 mb-1">
              Product Solution
            </label>
            <textarea
              id="lp-product-solution"
              value={editedContent.productSolution || ''}
              onChange={(e) => handleContentChange('productSolution', e.target.value)}
              className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Product solution..."
            />
          </div>
          <p className="text-xs text-gray-500 italic">
            Note: Landing pages have many fields. This editor shows key sections. Other fields can be edited through the full landing page editor.
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      {!isEditing ? (
        <div className="flex justify-end">
          <button
            onClick={handleEdit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {saveSuccess && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Changes saved successfully!</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit fields */}
      {isEditing && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          {renderEditFields()}
        </div>
      )}
    </div>
  )
}
