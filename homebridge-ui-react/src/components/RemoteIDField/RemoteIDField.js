export default function RemoteIDField({id, value, onChange, onSniff, canSniff=true, sniffing=false}) {
  const inputProps = {};
  if(onChange) inputProps.onChange = onChange;
  if(value) inputProps.value = value;
  if(id) inputProps.id = id;

  const buttonProps = {};
  if(onSniff && canSniff) buttonProps.onClick = onSniff;

  return (
  <div className="d-flex">
    <input 
      className="form-control" 
      name="remote_id" 
      type="text" 
      required={true} 
      style={{borderTopRightRadius: 0, borderBottomRightRadius: 0}}
      {...inputProps}
    />
    <button
      disabled={!canSniff}
      type="button" 
      className={`btn ${canSniff ? 'btn-teal' : 'btn-grey' } m-0`}
      style={{borderTopLeftRadius: 0, borderBottomLeftRadius: 0}}
      {...buttonProps}
    >{sniffing ? 'waiting' : 'Sniff'}</button>
  </div>
  );
}