const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='bg-gray-100 p-4 rounded-md w-full min-h-[200px] flex flex-col gap-4'>
      {children}
    </div>
  );
};

export default Card;
