import ArrowSvgTestominal from "@/svg/ArrowSvgTestominal"

const TestomianalHome  = () => {

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="w-[30%] ">
            <ArrowSvgTestominal />
          </div>
          <p className="text-5xl font-light">
            Real Voices for families who made
            <span className="font-bold text-primary text-6xl"> HYDERABAD </span>
            their forever home
          </p>
          <br />
          <button className="btn btn-primary">Explore More</button>
        </div>

        <div>
          <div className="relative z-0 w-full h-full">
            <TestomianalHome />
          </div>
        </div>
      </div>
    );
}
export default TestomianalHome