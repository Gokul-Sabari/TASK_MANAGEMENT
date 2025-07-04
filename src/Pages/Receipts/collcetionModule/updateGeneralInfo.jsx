import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import RequiredStar from "../../../Components/requiredStar";
import { payTypeAndStatus } from "./createReceipts";
import { isEqualNumber, LocalDate, NumberFormat, stringCompare, Subraction, toArray, toNumber } from "../../../Components/functions";



const UpdateGeneralInfoDialog = ({
    updateValues,
    setUpdateValues,
    open = false,
    onClose,
    update,
    creditAccount = [],
}) => {

    const paymentStatus = payTypeAndStatus.find(val => val.type === updateValues?.collection_type)?.statusOptions || [];

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth='md' fullWidth
            >
                <DialogTitle>Update Receipt</DialogTitle>
                <form onSubmit={e => {
                    e.preventDefault();
                    update({
                        ...updateValues,
                        verified_by: isEqualNumber(updateValues?.verify_status, 1) ? updateValues.verified_by : null
                    })
                }}>
                    <DialogContent>
                        <div className="table-responsive">
                            <table className="table table-borderless fa-13">
                                <tbody>
                                    {/* date */}
                                    <tr>
                                        <td>Date<RequiredStar /></td>
                                        <td>
                                            <input
                                                type="date"
                                                className="cus-inpt border p-2"
                                                value={updateValues?.collection_date}
                                                onChange={e => setUpdateValues(pre => ({ ...pre, collection_date: e.target.value }))}
                                                required
                                            />
                                        </td>
                                    </tr>

                                    {/* verify date */}
                                    <tr>
                                        <td>Verify Date</td>
                                        <td>
                                            <input
                                                type="date"
                                                value={updateValues?.bank_date ? updateValues?.bank_date : ''}
                                                onChange={e => setUpdateValues(pre => ({ ...pre, bank_date: e.target.value }))}
                                                className="cus-inpt border border p-2"
                                            />
                                        </td>
                                    </tr>

                                    {/* payment type  */}
                                    <tr>
                                        <td>Payment Type<RequiredStar /></td>
                                        <td>
                                            <select
                                                className="cus-inpt border p-2"
                                                value={updateValues?.collection_type}
                                                required
                                                onChange={e => setUpdateValues(pre => ({
                                                    ...pre,
                                                    collection_type: e.target.value,
                                                    payment_status: payTypeAndStatus.find(typ => typ.type === e.target.value)?.default
                                                }))}
                                            >
                                                <option value="" disabled>Select</option>
                                                <option value="CASH">CASH</option>
                                                <option value="UPI">UPI</option>
                                                <option value="CHEQUE">CHEQUE</option>
                                                <option value="BANK">BANK</option>
                                            </select>
                                        </td>
                                    </tr>

                                    {/* payment account */}
                                    <tr>
                                        <td>Payment Account <RequiredStar /></td>
                                        <td>
                                            <select
                                                className="cus-inpt border p-2"
                                                value={updateValues?.collection_account}
                                                required
                                                disabled={!updateValues?.collection_type}
                                                onChange={e => setUpdateValues(pre => ({
                                                    ...pre,
                                                    collection_account: e.target.value,
                                                }))}
                                            >
                                                <option value="" disabled>Select</option>
                                                {toArray(creditAccount).filter(
                                                    fil => stringCompare(updateValues.collection_type, 'CASH')
                                                        ? stringCompare(fil.Type, 'CASH')
                                                        : !stringCompare(fil.Type, 'CASH')
                                                ).map(
                                                    (o, i) => <option value={o?.Id} key={i}>{o?.Bank_Name}</option>
                                                )}
                                            </select>
                                        </td>
                                    </tr>

                                    {/* payment status */}
                                    <tr>
                                        <td>Payment Status<RequiredStar /></td>
                                        <td>
                                            <select
                                                className="cus-inpt border p-2"
                                                value={updateValues?.payment_status}
                                                required
                                                disabled={!updateValues?.collection_type}
                                                onChange={e => setUpdateValues(pre => ({ ...pre, payment_status: e.target.value }))}
                                            >
                                                <option value="" disabled>Select</option>
                                                {paymentStatus.map((status, ind) => (
                                                    <option value={status} key={ind}>{status}</option>
                                                ))}
                                                <option value="Canceled">Canceled</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </td>
                                    </tr>

                                    {/* verify status */}
                                    <tr>
                                        <td>Verify Status</td>
                                        <td>
                                            <select
                                                value={updateValues?.verify_status}
                                                onChange={e => setUpdateValues(pre => ({ ...pre, verify_status: e.target.value }))}
                                                className="cus-inpt border border p-2"
                                            >
                                                <option value={0}>Not-verified</option>
                                                <option value={1}>verified</option>
                                            </select>
                                        </td>
                                    </tr>

                                    {/* narration */}
                                    <tr>
                                        <td>Narration</td>
                                        <td>
                                            <textarea
                                                className="cus-inpt border p-2"
                                                value={updateValues?.narration}
                                                onChange={e => setUpdateValues(pre => ({ ...pre, narration: e.target.value }))}
                                                placeholder="Narration..."
                                            />
                                        </td>
                                    </tr>

                                </tbody>
                            </table>

                            <table className="table table-bordered fa-13">
                                <thead>
                                    <tr>
                                        {['Sno', 'Invoice No', 'Invoice Date', 'Invoice Value', 'Total Receipt', 'Receipt Amount'].map(
                                            (receipt, receiptIndex) => (
                                                <th key={receiptIndex}>{receipt}</th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {toArray(updateValues?.Receipts).map(
                                        (receipt, receiptIndex) => {
                                            const preCollectAmount = toNumber(receipt?.collected_amount);
                                            return (
                                                <tr key={receiptIndex}>
                                                    <td>{receiptIndex + 1}</td>
                                                    <td>{receipt?.Do_Inv_No}</td>
                                                    <td>{LocalDate(receipt?.Do_Date)}</td>
                                                    <td>{NumberFormat(receipt?.Total_Invoice_value)}</td>
                                                    <td>{NumberFormat(receipt?.total_receipt_amount)}</td>
                                                    <td>
                                                        <input
                                                            className="cus-inpt"
                                                            value={receipt?.collected_amount}
                                                            // onInput={onlynum}
                                                            type="number"
                                                            required
                                                            max={Subraction(
                                                                receipt?.Total_Invoice_value,
                                                                Subraction(receipt?.total_receipt_amount, preCollectAmount)
                                                            )}
                                                            onChange={e => setUpdateValues(pre => {
                                                                const prevReceipts = [...pre.Receipts];

                                                                prevReceipts[receiptIndex].collected_amount = e.target.value;
                                                                return { ...pre, Receipts: prevReceipts };
                                                            })}
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>


                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose} type="button">cancel</Button>
                        <Button
                            type="submit"
                            variant="outlined"
                        >update</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    )
}

export default UpdateGeneralInfoDialog;