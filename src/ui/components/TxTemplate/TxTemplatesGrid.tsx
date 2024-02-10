import { useEffect, useState } from 'react';
import { TxTemplate } from '../../../types';
import { calcaulteSize } from '../../../services/transaction.service';
import definedTemplates from '../../../templates';
import TxTemplateCard from './TxTemplateCard';
import { useAppContext } from '../../../AppContext';
import SearchInput from '../SearchInput';
import {
  InfoCircle,
  ReportsSolid,
  SortDown,
  SortUp,
  TableRows,
  ViewGrid,
  WarningCircleSolid,
  Xmark,
} from 'iconoir-react';
import Button from '../Button';
import { TxTemplateCardMode } from './types';
import useScreenSize from '../../hooks';
import { SCREEN_SIZE_MD } from '../../../constants';

enum SortField {
  name = 'name',
  size = 'size',
  none = 'none',
}
enum SortDirection {
  asc = 'asc',
  desc = 'desc',
}

export default function TxTemplatesGrid() {
  const {
    state: { feeStats },
  } = useAppContext();
  const screenSize = useScreenSize();

  const [showInfoBox, setShowInfoBox] = useState<boolean>(false);
  const [calculatedTemplates, setCalculatedTemplates] =
    useState<TxTemplate[]>();
  const [finalTemplates, setFinalTemplates] = useState<TxTemplate[]>();
  const [searchText, setSearchText] = useState<string>();
  const [sortingField, setSortingField] = useState<SortField>(SortField.none);
  const [sortingDirection, setSortingDirection] = useState<SortDirection>(
    SortDirection.asc,
  );
  const [gridMode, setGridMode] = useState<TxTemplateCardMode>(
    TxTemplateCardMode.row,
  );

  function calculateTemplatesCosts() {
    console.debug('Calculating size and cost...');

    const calculatedTemplates = definedTemplates as TxTemplate[];
    for (let t = 0; t < definedTemplates.length; t++) {
      const template = definedTemplates[t];
      template.sizeVB = calcaulteSize(template);
      // now calculate cost (use Math.ceil to round up sats amoung)
      template.costSats = {
        economy: Math.ceil(template.sizeVB * (feeStats?.economy ?? 0)),
        minimum: Math.ceil(template.sizeVB * (feeStats?.minimum ?? 0)),
        hour: Math.ceil(template.sizeVB * (feeStats?.hour ?? 0)),
        halfHour: Math.ceil(template.sizeVB * (feeStats?.halfHour ?? 0)),
        fastest: Math.ceil(template.sizeVB * (feeStats?.fastest ?? 0)),
        medianNextBlock: Math.ceil(
          template.sizeVB * (feeStats?.medianNextBlock ?? 0),
        ),
        minimumNextBlock: Math.ceil(
          template.sizeVB * (feeStats?.minimumNextBlock ?? 0),
        ),
      };
    }
    setCalculatedTemplates(calculatedTemplates);
  }

  useEffect(() => {
    calculateTemplatesCosts();
  }, [feeStats]);

  useEffect(() => {
    filterTemplates();
  }, [searchText, sortingField, sortingDirection, calculatedTemplates]);

  useEffect(() => {
    if (screenSize.width <= SCREEN_SIZE_MD) {
      setGridMode(TxTemplateCardMode.card);
    }
  }, [screenSize]);

  function filterTemplates() {
    let filteredSortedTemplates = calculatedTemplates?.slice() ?? [];
    if (searchText) {
      filteredSortedTemplates = filteredSortedTemplates?.filter((template) => {
        const searchTextL = searchText.toLowerCase();
        // search in name and in tags
        return (
          template.name.toLowerCase().indexOf(searchTextL) >= 0 ||
          template.tags?.some(
            (tag) => tag.toLowerCase().indexOf(searchTextL) >= 0,
          )
        );
      });
    }

    // now sort
    if (sortingField != SortField.none) {
      filteredSortedTemplates = filteredSortedTemplates.sort(
        (templateA, templateB) => {
          switch (sortingField) {
            case SortField.name:
              return sortingDirection == SortDirection.asc
                ? templateA.name.localeCompare(templateB.name)
                : templateB.name.localeCompare(templateA.name);
            case SortField.size:
              return sortingDirection == SortDirection.asc
                ? (templateA.sizeVB ?? 0) - (templateB.sizeVB ?? 0)
                : (templateB.sizeVB ?? 0) - (templateA.sizeVB ?? 0);
            default:
              return 0;
          }
        },
      );
    }

    setFinalTemplates(filteredSortedTemplates);
  }

  //#region Handle functions

  function handleInfoBoxButtonClick() {
    setShowInfoBox(!showInfoBox);
  }

  function handleSearchChange(text: string) {
    setSearchText(text);
  }

  function handleSortFieldNameClick() {
    // if changed field set "asc", otherwise invert
    setSortingDirection(
      sortingField != SortField.name
        ? SortDirection.asc
        : sortingDirection == SortDirection.asc
          ? SortDirection.desc
          : SortDirection.asc,
    );
    setSortingField(SortField.name);
  }
  function handleSortFieldSizeClick() {
    // if changed field set "asc", otherwise invert
    setSortingDirection(
      sortingField != SortField.size
        ? SortDirection.asc
        : sortingDirection == SortDirection.asc
          ? SortDirection.desc
          : SortDirection.asc,
    );
    setSortingField(SortField.size);
  }
  function handleSortNoneClick() {
    setSortingField(SortField.none);
  }

  function handleViewModeCardClick() {
    setGridMode(TxTemplateCardMode.card);
  }
  function handleViewModeRowClick() {
    setGridMode(TxTemplateCardMode.row);
  }

  //#endregion Handle functions

  return (
    <div className="flex-1 my-4">
      <h2 className="text-2xl font-bold">
        Transaction templates
        <InfoCircle
          className="text-sky-500 inline-block ms-1 cursor-pointer"
          width="1em"
          height="1em"
          onClick={handleInfoBoxButtonClick}
        />
      </h2>
      {showInfoBox && (
        <div
          id="info-help"
          className="flex-1 p-2 text-sm bg-sky-100 mb-2
          border border-solid border-sky-400 rounded"
        >
          <span className="flex flex-row">
            <ReportsSolid className="text-lime-600 me-1" />
            Sats to spend for the fees to be up to 0.1%
          </span>
          <span className="flex flex-row">
            <ReportsSolid className="text-amber-600 me-1" />
            Sats to spend for the fees to be up to 1%
          </span>
          <span className="flex flex-row">
            <ReportsSolid className="text-red-600 me-1" />
            Sats to spend for the fees to be 5%
          </span>
          <span className="flex flex-row">
            <WarningCircleSolid className="text-red-600 me-1" />
            Sats to spend to make the transaction uneconomic
          </span>
        </div>
      )}
      <div className="flex flex-col md:flex-row">
        <div className="grow">
          <SearchInput onSearch={handleSearchChange} />
        </div>
        <div className="flex flex-row items-center ms-0 md:ms-2 mt-2 md:mt-0">
          <span className="me-1">Sort by:</span>
          <Button
            onClick={handleSortFieldNameClick}
            active={sortingField == SortField.name}
            className="flex flex-row flex-nowrap"
          >
            Name
            {sortingField == SortField.name &&
              (sortingDirection == SortDirection.asc ? (
                <SortUp />
              ) : (
                <SortDown />
              ))}
          </Button>
          <Button
            onClick={handleSortFieldSizeClick}
            active={sortingField == SortField.size}
            className="flex flex-row flex-nowrap"
          >
            Size
            {sortingField == SortField.size &&
              (sortingDirection == SortDirection.asc ? (
                <SortUp />
              ) : (
                <SortDown />
              ))}
          </Button>
          <Button
            onClick={handleSortNoneClick}
            className="flex flex-row flex-nowrap"
          >
            <Xmark />
          </Button>
          <Button
            onClick={handleViewModeCardClick}
            className="ms-2"
            active={gridMode == TxTemplateCardMode.card}
            title="Tile / Grid view"
          >
            <ViewGrid />
          </Button>
          <Button
            onClick={handleViewModeRowClick}
            active={gridMode == TxTemplateCardMode.row}
            title="Table view"
          >
            <TableRows />
          </Button>
        </div>
      </div>
      <div className="flex-1">
        {!finalTemplates || finalTemplates.length == 0 ? (
          <p>
            (No transaction templates available{' '}
            {searchText && ` for the term "${searchText}"`})
          </p>
        ) : (
          <div className="flex sm:flex-row sm:flex-wrap flex-col">
            {finalTemplates.map((template) => (
              <TxTemplateCard
                key={template.code}
                template={template}
                mode={gridMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
