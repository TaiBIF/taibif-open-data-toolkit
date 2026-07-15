import { RefObject, useEffect, useRef, useState } from 'react';

type UseAutoPageSizeArgs = {
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  page: number;
  pageSize: number;
  bottomMargin?: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
};

const HEADER_AND_PADDING_HEIGHT = 48;
const ESTIMATED_ROW_HEIGHT = 28;
const MIN_AUTO_PAGE_SIZE = 5;

const calculateAutoPageSize = (height: number) =>
  Math.max(
    MIN_AUTO_PAGE_SIZE,
    Math.floor((height - HEADER_AND_PADDING_HEIGHT) / ESTIMATED_ROW_HEIGHT),
  );

const useAutoPageSize = ({
  containerRef,
  enabled,
  page,
  pageSize,
  bottomMargin = 0,
  setPage,
  setPageSize,
}: UseAutoPageSizeArgs) => {
  const pageRef = useRef(page);
  const pageSizeRef = useRef(pageSize);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const updatePageSize = (height: number) => {
      const usableHeight = Math.max(0, height - bottomMargin);
      setContainerHeight(usableHeight);
      if (!enabled) return;

      const nextPageSize = calculateAutoPageSize(usableHeight);
      const currentPageSize = pageSizeRef.current;
      if (nextPageSize === currentPageSize) return;

      const firstRowIndex = Math.max(
        0,
        (pageRef.current - 1) * currentPageSize,
      );
      setPageSize(nextPageSize);
      setPage(Math.floor(firstRowIndex / nextPageSize) + 1);
    };

    updatePageSize(containerRef.current.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updatePageSize(entry.contentRect.height);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef, enabled, setPage, setPageSize]);

  return { containerHeight };
};

export default useAutoPageSize;
