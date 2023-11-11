import { useState, type FC, useCallback, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { AddEventProps } from '@/lib/types'
import { listen } from '@tauri-apps/api/event'
import { Virtuoso } from 'react-virtuoso'

const Home: FC = () => {
  const [readDirArray, setReadDirArray] = useState<AddEventProps[]>([])
  const [searchInput, setSearchInput] = useState<string>('')
  const [currentDirectoryInput, setCurrentDirectoryInput] = useState<string>()
  const [isIncludeHiddenFoldersChecked, setIsIncludeHiddenFoldersChecked] =
    useState<boolean>(false)
  const [isIncludeFileExtensionsChecked, setIsIncludeFileExtensionsChecked] =
    useState<boolean>(false)

  const memorisedSetReadDirArray = useCallback(() => {
    const unlisten = listen('add', (event: { payload: AddEventProps }) => {
      setReadDirArray(prevValue => [...prevValue, event.payload])
    })

    return () => {
      unlisten.then(remove => remove())
    }
  }, [setReadDirArray])

  useEffect(memorisedSetReadDirArray, [memorisedSetReadDirArray])

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <input
          placeholder="Search"
          onChange={event => setSearchInput(event.target.value)}
        />
        <input
          placeholder="Directory"
          onChange={event => setCurrentDirectoryInput(event.target.value)}
        />
      </div>

      <div>
        <input
          type="checkbox"
          id="horns"
          onChange={event => {
            setIsIncludeHiddenFoldersChecked(event.target.checked)
          }}
        />
        <label htmlFor="horns">Is include hidden folders checked</label>
      </div>

      <div>
        <input
          type="checkbox"
          id="scales"
          onChange={event => {
            setIsIncludeFileExtensionsChecked(event.target.checked)
          }}
        />
        <label htmlFor="scales">Is include file extensions checked</label>
      </div>

      <button
        onClick={() => {
          setReadDirArray([])
          invoke('find_files_and_folders', {
            current_directory: currentDirectoryInput,
            search_in_directory: searchInput.toLowerCase(),
            include_hidden_folders: isIncludeHiddenFoldersChecked,
            include_file_extension: isIncludeFileExtensionsChecked
          })
        }}
      >
        find
      </button>

      <button onClick={() => invoke('stop_finding')}>stop</button>

      <Virtuoso
        style={{ height: 750, width: '16rem' }}
        data={readDirArray}
        totalCount={readDirArray.length}
        itemContent={index => {
          const fileOrFolder = readDirArray[index]

          return <a>{fileOrFolder.name}</a>
        }}
      />
    </>
  )
}

export default Home
