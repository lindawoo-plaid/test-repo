import React, { useEffect, useState } from 'react';
import Note from 'plaid-threads/Note';
import Button from 'plaid-threads/Button';
import { Institution } from 'plaid/dist/api';

import { ItemType } from './types';
import { UpdateLink } from '.';
import { useAccounts, useInstitutions, useItems, useLink } from '../services';
import { setItemToBadState } from '../services/api';

const PLAID_ENV = process.env.REACT_APP_PLAID_ENV || 'sandbox';

interface Props {
  item: ItemType | null;
  userId: number;
  isIdentityChecked: boolean;
  numOfItems: number;
  accountName: string;
}

const ItemInfo = (props: Props) => {
  const [institution, setInstitution] = useState<Institution | null>(null);

  const { deleteAccountsByItemId } = useAccounts();
  const { deleteItemById } = useItems();
  const { institutionsById, getInstitutionById } = useInstitutions();
  const id = props.item != null ? props.item.id : 0;
  const plaid_institution_id =
    props.item != null ? props.item.plaid_institution_id : '';
  const status = props.item != null ? props.item.status : '';
  const isSandbox = PLAID_ENV === 'sandbox';
  const isGoodState = status === 'good';
  const { deleteLinkToken } = useLink();

  useEffect(() => {
    setInstitution(institutionsById[plaid_institution_id] || {});
  }, [institutionsById, plaid_institution_id]);

  useEffect(() => {
    getInstitutionById(plaid_institution_id);
  }, [getInstitutionById, plaid_institution_id]);

  const handleSetBadState = () => {
    setItemToBadState(id);
  };
  const handleDeleteItem = () => {
    deleteItemById(id, props.userId);
    deleteAccountsByItemId(id);
    deleteLinkToken(props.userId);
  };

  return (
    <>
      <div>
        <h3 className="heading">bank</h3>
        {institution != null && <p className="value">{institution.name}</p>}
      </div>
      <div>
        <h3 className="heading">account</h3>
        <p className="value">{props.accountName}</p>
      </div>
      {props.numOfItems !== 0 && (
        <>
          <div className="test-update-mode">
            <div className="update_mode_note">
              {isGoodState ? (
                <Note info solid>
                  Login
                  <br />
                  Updated
                </Note>
              ) : (
                <Note error solid>
                  Login <br /> Required
                </Note>
              )}
            </div>
            {isSandbox && isGoodState && (
              <Button
                secondary
                small
                centered
                inline
                onClick={handleSetBadState}
              >
                Test Item Login Required
              </Button>
            )}
            {isSandbox && !isGoodState && (
              <UpdateLink
                setBadStateShown={isSandbox && isGoodState}
                handleDelete={handleDeleteItem}
                handleSetBadState={handleSetBadState}
                userId={props.userId}
                itemId={id}
              />
            )}
          </div>
          <div className="remove_bank_button_container">
            <Button
              className="remove_bank_button "
              small
              inline
              secondary
              centered
              onClick={handleDeleteItem}
            >
              Remove Bank
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default ItemInfo;
